import { BrowserWindow } from "electron";
import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import { WebSocket, WebSocketServer } from "ws";
import type { ActionResult, ActionSchema, WsMessage, WsSubscription } from "./types";

type NativeActionHandler = (data: WsMessage) => ActionResult;

const ipcChannel = "api.playback.control";

const schemas: Record<string, ActionSchema> = {
    setRepeatMode: {
        param: "mode",
        validate: (v): v is number => typeof v === "number",
    },
    setShuffleMode: {
        param: "shuffle",
        validate: (v): v is boolean => typeof v === "boolean",
    },
    seek: {
        param: "time",
        validate: (v): v is number => typeof v === "number",
    },
    volume: {
        param: "volume",
        validate: (v): v is string | number =>
            (typeof v === "string" && /^[-+]\d+$/.test(v)) ||
            (typeof v === "number" && v >= 0 && v <= 100),
    },
    playNext: {
        param: "itemId",
        validate: (v): v is string => typeof v === "string" && v.length > 0,
    },
    addToQueue: {
        param: "itemId",
        validate: (v): v is string => typeof v === "string" && v.length > 0,
    },
};

let server: Server | null = null;
let wss: WebSocketServer | null = null;
const fields: Record<string, unknown> = {};
const wsSubscriptions = new Map<WebSocket, WsSubscription>();

const sendToRenderer = (data: Record<string, unknown>) => {
    const tidalWindow = BrowserWindow.fromId(1);
    if (!tidalWindow) {
        console.warn("sendToRenderer: No tidalWindow available");
        return;
    }
    tidalWindow.webContents.send(ipcChannel, data);
};

const invokeRenderer = async (data: Record<string, unknown>): Promise<{ success: boolean; response?: unknown }> => {
    const tidalWindow = BrowserWindow.fromId(1);
    if (!tidalWindow) {
        console.warn("invokeRenderer: No tidalWindow available");
        return { success: false };
    }
    try {
        const response = await tidalWindow.webContents.executeJavaScript(
            `window.__apiInvokeAction?.(${JSON.stringify(data)})`
        );
        return { success: true, response };
    } catch (e) {
        console.error("invokeRenderer error:", e);
        return { success: false };
    }
};


const sendWsResponse = (ws: WebSocket, payload: Record<string, unknown>) =>
    ws.send(JSON.stringify(payload));

const sendWsError = (ws: WebSocket, error: string) =>
    sendWsResponse(ws, { type: "error", error });


const createActionHandler = (schema: ActionSchema): NativeActionHandler => {
    return (data) => {
        const paramValue = data[schema.param as keyof WsMessage];
        if (!schema.validate(paramValue)) {
            return { success: false };
        }
        const payload = { action: data.action, [schema.param!]: paramValue };
        sendToRenderer(payload);
        return { success: true, response: { type: "ok", ...payload } };
    };
};

const actionHandlers: Record<string, NativeActionHandler> = Object.fromEntries(
    Object.entries(schemas).map(([action, schema]) => [action, createActionHandler(schema)])
);

const handleWsSubscribe = (ws: WebSocket, data: WsMessage): boolean => {
    if (!Array.isArray(data.fields)) return false;

    const sub = wsSubscriptions.get(ws)!;
    sub.fields = new Set(data.fields);
    sub.all = !!data.all;

    sendWsResponse(ws, {
        type: "subscribed",
        fields: Array.from(sub.fields),
        all: sub.all,
    });
    return true;
};

const handleWsUnsubscribe = (ws: WebSocket): void => {
    const sub = wsSubscriptions.get(ws)!;
    sub.fields.clear();
    sub.all = false;
    sendWsResponse(ws, { type: "unsubscribed" });
};


const handleWsMessage = async (ws: WebSocket, data: WsMessage) => {
    const { action } = data;

    if (action === "subscribe") {
        if (!handleWsSubscribe(ws, data)) {
            sendWsError(ws, "Malformed subscribe action");
        }
        return;
    }

    if (action === "unsubscribe") {
        handleWsUnsubscribe(ws);
        return;
    }

    const handler = actionHandlers[action];
    if (handler) {
        const result = handler(data);
        if (result.success && result.response) {
            sendWsResponse(ws, result.response);
        } else {
            sendWsError(ws, `Malformed ${action} action`);
        }
        return;
    }

    const result = await invokeRenderer({ ...data });
    if (result.success) {
        sendWsResponse(ws, { type: "ok", action, data: result.response });
    } else {
        sendWsError(ws, `Action "${action}" failed or not found`);
    }
};

const sendHttpResponse = (res: ServerResponse, status: number, data: Record<string, unknown>) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
};

const parseRequestBody = (req: IncomingMessage): Promise<Record<string, unknown>> =>
    new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(new Error("Invalid JSON"));
            }
        });
        req.on("error", reject);
    });

const handleHttpAction = async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const action = url.pathname.slice(1);

    if (!action) {
        sendHttpResponse(res, 400, { type: "error", error: "No action specified" });
        return;
    }

    try {
        const body = await parseRequestBody(req);
        const data: WsMessage = { action, ...body };
        const handler = actionHandlers[action];
        if (handler) {
            const result = handler(data);
            if (result.success && result.response) {
                sendHttpResponse(res, 200, result.response);
            } else {
                sendHttpResponse(res, 400, { type: "error", error: `Malformed ${action} action` });
            }
            return;
        }
        const result = await invokeRenderer({ ...data });
        if (result.success) {
            sendHttpResponse(res, 200, { type: "ok", action, data: result.response });
        } else {
            sendHttpResponse(res, 400, { type: "error", error: `Action "${action}" failed or not found` });
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : "Invalid request";
        sendHttpResponse(res, 400, { type: "error", error: message });
    }
};



const handleHttpRequest = (req: IncomingMessage, res: ServerResponse) => {
    Object.entries({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }).forEach(([key, value]) => res.setHeader(key, value));

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === "POST") {
        handleHttpAction(req, res);
        return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(fields, null, 2));
};


const handleWsConnection = (ws: WebSocket) => {
    wsSubscriptions.set(ws, { fields: new Set(), all: false });

    ws.on("message", (message: WebSocket.RawData) => {
        try {
            const data = JSON.parse(message.toString()) as WsMessage;
            handleWsMessage(ws, data);
        } catch (e) {
            console.error("WebSocket message error:", e);
            sendWsError(ws, "Invalid message format");
        }
    });

    ws.on("close", () => wsSubscriptions.delete(ws));
};


const notifyWebSocketClients = (field: string, value: unknown) => {
    if (!wss || fields[field] === value) return;

    for (const [ws, sub] of wsSubscriptions) {
        if (ws.readyState !== WebSocket.OPEN) continue;

        if (sub.all) {
            sendWsResponse(ws, { type: "update", all: true, fields });
        } else if (sub.fields.has(field)) {
            sendWsResponse(ws, { type: "update", all: false, field, value });
        }
    }
};

const updateField = (field: string, value: unknown) => {
    if (!server) {
        console.warn(`Cannot update field "${field}": server not running`);
        return;
    }
    notifyWebSocketClients(field, value);
    fields[field] = value;
};


const startServer = async (port: number) => {
    if (server) {
        await stopServer();
    }

    server = createServer(handleHttpRequest);
    server.listen(port, () => console.log(`API server running on port ${port}`));

    wss = new WebSocketServer({ server });
    wss.on("connection", handleWsConnection);
};

const stopServer = async () => {
    if (wss) {
        wss.clients.forEach((ws) => ws.close());
        wss.close();
        wss = null;
    }

    if (server) {
        server.close(() => {
            server = null;
            console.log("API server stopped");
        });
    }
};

const updateFields = (recordedFields: Record<string, unknown>) => {
    Object.entries(recordedFields).forEach(([key, value]) => updateField(key, value));
};

export { startServer, stopServer, updateFields };

