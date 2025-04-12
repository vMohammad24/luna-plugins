import { trace } from ".";
import { getClientMessageChannelEnum } from "./ipc.native";

const ClientMessageChannelEnum = getClientMessageChannelEnum();

const ipcRenderer = window.electron.ipcRenderer;
const ipcListeners: Record<string, (_: unknown, ...args: any[]) => void> = {};
export const startNativeIPCLog = async () => {
	for (const eventName of Object.values(await ClientMessageChannelEnum)) {
		if (eventName === "client.playback.playersignal") continue; // This event is too spammy
		ipcListeners[eventName] = (_, ...args) => trace.log("(Native -> Render)", eventName, ...args);
		ipcRenderer.on(eventName, ipcListeners[eventName]);
	}
};
export const stopNativeIPCLog = async () => {
	for (const eventName in ipcListeners) {
		ipcRenderer.removeListener(eventName, ipcListeners[eventName]);
		delete ipcListeners[eventName];
	}
};
