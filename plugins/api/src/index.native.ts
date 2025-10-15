import { BrowserWindow } from "electron";
import { createServer, Server } from "http";
import { WebSocket, WebSocketServer } from "ws";

let server: Server | null;
let wss: WebSocketServer | null = null;
const fields: any = {};
const wsSubscriptions = new Map<WebSocket, { fields: Set<string>; all: boolean }>();

const controlActions = [
    "pause", "resume", "toggle", "next", "previous", "volume", "playNext", "addToQueue"
] as const;
type ControlAction = typeof controlActions[number];

function isControlAction(action: any): action is ControlAction {
    return controlActions.includes(action);
}

function sendToRenderer(channel: string, data: any) {
    const tidalWindow = BrowserWindow.fromId(1);
    if (!tidalWindow) {
        console.warn("sendToRenderer: BrowserWindow with id 1 not found.");
        return;
    }
    tidalWindow.webContents.send(channel, data);
}

export const startServer = async (port: number) => {
    if (server) {
        await stopServer();
        await startServer(port);
    }
    server = createServer(async (req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(fields, null, 2));
    });
    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

    wss = new WebSocketServer({ server });
    wss.on("connection", (ws: WebSocket) => {
        wsSubscriptions.set(ws, { fields: new Set(), all: false });
        ws.on("message", (message: WebSocket.RawData) => {
            try {
                const data = JSON.parse(message.toString());
                switch (data.action) {
                    case "subscribe":
                        if (Array.isArray(data.fields)) {
                            wsSubscriptions.get(ws)!.fields = new Set(data.fields);
                            wsSubscriptions.get(ws)!.all = !!data.all;
                        }
                        ws.send(
                            JSON.stringify({
                                type: "subscribed",
                                fields: Array.from(wsSubscriptions.get(ws)!.fields),
                                all: wsSubscriptions.get(ws)!.all,
                            })
                        );
                        break;
                    case "unsubscribe":
                        wsSubscriptions.get(ws)!.fields.clear();
                        wsSubscriptions.get(ws)!.all = false;
                        ws.send(JSON.stringify({ type: "unsubscribed" }));
                        break;
                    case "setRepeatMode":
                        if (typeof data.mode === "number") {
                            sendToRenderer("api.playback.control", { action: data.action, mode: data.mode });
                            ws.send(JSON.stringify({ type: "ok", action: data.action, mode: data.mode }));
                        } else {
                            ws.send(JSON.stringify({ type: "error", error: `Malformed setRepeatMode action` }));
                        }
                        break;
                    case "setShuffleMode":
                        if (typeof data.shuffle === "boolean") {
                            sendToRenderer("api.playback.control", { action: data.action, shuffle: data.shuffle });
                            ws.send(JSON.stringify({ type: "ok", action: data.action, shuffle: data.shuffle }));
                        } else {
                            ws.send(JSON.stringify({ type: "error", error: `Malformed setShuffleMode action` }));
                        }
                        break;
                    case "seek":
                        if (typeof data.time === "number") {
                            sendToRenderer("api.playback.control", { action: data.action, time: data.time });
                            ws.send(JSON.stringify({ type: "ok", action: data.action, time: data.time }));
                        } else {
                            ws.send(JSON.stringify({ type: "error", error: `Malformed seek action` }));
                        }
                        break;
                    case "volume":
                        if ((typeof data.volume === "string" && /^[-+]\d+$/.test(data.volume)) || (typeof data.volume === "number" && data.volume >= 0 && data.volume <= 100)) {
                            sendToRenderer("api.playback.control", { action: data.action, volume: data.volume });
                            ws.send(JSON.stringify({ type: "ok", action: data.action, volume: data.volume }));
                        } else {
                            ws.send(JSON.stringify({ type: "error", error: `Malformed volume action` }));
                        }
                        break;
                    case "playNext":
                        if (data.itemId) {
                            sendToRenderer("api.playback.control", { action: data.action, itemId: data.itemId });
                            ws.send(JSON.stringify({ type: "ok", action: data.action, itemId: data.itemId }));
                        } else {
                            ws.send(JSON.stringify({ type: "error", error: `Malformed playNext action` }));
                        }
                        break;
                    case "addToQueue":
                        if (data.itemId) {
                            sendToRenderer("api.playback.control", { action: data.action, itemId: data.itemId });
                            ws.send(JSON.stringify({ type: "ok", action: data.action, itemId: data.itemId }));
                        } else {
                            ws.send(JSON.stringify({ type: "error", error: `Malformed addToQueue action` }));
                        }
                        break;
                    default:
                        if (isControlAction(data.action)) {
                            sendToRenderer("api.playback.control", { action: data.action });
                            ws.send(JSON.stringify({ type: "ok", action: data.action }));
                        } else {
                            ws.send(JSON.stringify({ type: "error", error: `Unknown or malformed action: ${data.action}` }));
                        }
                }
            } catch (e) {
                console.error("Error processing WebSocket message:", e);
                ws.send(JSON.stringify({ type: "error", error: "Invalid message format" }));
            }
        });
        ws.on("close", () => {
            wsSubscriptions.delete(ws);
        });
    });
};

export const stopServer = async () => {
    if (wss) {
        wss.clients.forEach((ws: WebSocket) => ws.close());
        wss.close();
        wss = null;
    }
    if (server) {
        server.close(() => {
            server = null;
            console.log("Server has been stopped.");
        });
    }
}

function notifyWebSocketClients(field: string, value: any) {
    if (!wss) return;
    const previousValue = fields[field];
    if (previousValue === value) return;

    for (const [ws, sub] of wsSubscriptions.entries()) {
        if (ws.readyState !== ws.OPEN) continue;
        if (sub.all) {
            ws.send(JSON.stringify({ type: "update", all: true, fields }));
        } else if (sub.fields.has(field)) {
            ws.send(JSON.stringify({ type: "update", all: false, field, value }));
        }
    }
}

const updateField = (field: string, value: any) => {
    if (server) {
        notifyWebSocketClients(field, value);
        fields[field] = value;
    } else {
        console.warn(`Couldn't update field "${field}" to "${value}" because the server is not running.`);
    }
}

export const updateFields = async (recordedFields: Record<string, any>) => {
    for (const key in recordedFields) {
        updateField(key, recordedFields[key]);
    }
}