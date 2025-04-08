import { BrowserWindow } from "electron";

export const broadcast = (channel: string, ...args: any[]) => {
	for (const window of BrowserWindow.getAllWindows()) {
		window.webContents.send(channel, ...args);
	}
};
