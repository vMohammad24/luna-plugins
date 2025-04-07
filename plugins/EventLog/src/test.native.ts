const _default = (module: any) => module.default.default;
const importNative = (path: string) => Function(`return import("${path}")`)();

// const RepeatModeEnum: Promise<Record<string, string>> = importNative("../original.asar/app/shared/playback/RepeatModeEnum.js").then(_default);
// const clientDispatcher: Promise<Record<string, string>> = importNative("../original.asar/app/main/client/clientDispatcher.js").then(_default);

const ClientMessageChannelEnum: Promise<Record<string, string>> = importNative("../original.asar/app/shared/client/ClientMessageChannelEnum.js").then(_default);

import { ipcMain, IpcMainEvent } from "electron";

import { Tracer } from "@inrixia/lib.native";
const trace = Tracer("[test.native]");

export const AppEventEnum: Promise<Record<string, string>> = importNative("../original.asar/app/shared/AppEventEnum.js").then(_default);
export const getClientMessageChannelEnum = () => ClientMessageChannelEnum;

const ipcListeners: Record<string, (_: IpcMainEvent, ...args: any[]) => void> = {};
export const startNativeIpcLogging = async () => {
	for (const eventName of Object.values(await AppEventEnum)) {
		// I dont want this spam when testing
		if (eventName === "playback.current.time") continue;
		ipcListeners[eventName] = (_, ...args) => trace.log(eventName, ...args);
		ipcMain.on(eventName, ipcListeners[eventName]);
	}
};
export const stopNativeIpcLogging = async () => {
	for (const eventName in ipcListeners) {
		ipcMain.removeListener(eventName, ipcListeners[eventName]);
		delete ipcListeners[eventName];
	}
};
