export { Settings } from "./Settings";
import { StyleTag, Unload, getStorage } from "@triton/lib";

import "./editor.native";

import { closeEditor, openEditor as openEditorNative } from "./editor.native";

const storage = getStorage("", { css: "" });

export const unloads = new Set<Unload>();

export const openEditor = () => openEditorNative(storage.css);
const style = new StyleTag("Themer", unloads, storage.css);

window.electron.ipcRenderer.on("THEMER_SET_CSS", (_, css: string) => {
	storage.css = css;
	style.css = css;
});

const onKeyDown = (event: KeyboardEvent) => event.ctrlKey && event.key === "e" && openEditor();
document.addEventListener("keydown", onKeyDown);

unloads.add(closeEditor);
unloads.add(() => window.electron.ipcRenderer.removeAllListeners("THEMER_SET_CSS"));
unloads.add(() => document.removeEventListener("keydown", onKeyDown));
unloads.add(style.remove.bind(style));
