import { LunaUnload, Tracer } from "@luna/core";
import { ipcRenderer } from "@luna/lib";
export const { trace } = Tracer("[betterPlayer]");
export const unloads = new Set<LunaUnload>();
export { Settings } from "./Settings";




export const sendCommand = (command: string, args?: Record<string, any>) => {
    console.log("Sending command:", command, args);
    ipcRenderer.send("player.message", JSON.stringify({ command, ...args }));
}


export const handleEvent = (event: string, cb: (data: any) => void) => {
    ipcRenderer.on(unloads, event, cb);
}

export const getData = (command: string, args?: Record<string, any>) => {
    ipcRenderer.send("player.message", JSON.stringify({ command, ...args }));
    return new Promise<any>((resolve) => {
        ipcRenderer.once(unloads, command, (data) => {
            resolve(JSON.parse(data));
        });
    });
}