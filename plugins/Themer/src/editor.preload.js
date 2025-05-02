const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("ipcRenderer", {
	setCSS: (css) => ipcRenderer.send("themer.setCSS", css),
});
