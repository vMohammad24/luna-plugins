import { BrowserWindow } from "electron";

let initialLimits: number[] | undefined;

export const removeLimits = () => {
	const win = BrowserWindow.getAllWindows()[0];
	if (!initialLimits) initialLimits = win.getMinimumSize();
	win.setMinimumSize(0, 0);
};

export const restoreLimits = () => {
	const win = BrowserWindow.getAllWindows()[0];
	if (initialLimits) win.setMinimumSize(initialLimits[0], initialLimits[1]);
};
