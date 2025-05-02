export { Settings } from "./Settings";

import { ReactiveStore, type LunaUnload } from "@luna/core";
import "./editor.native";

import { StyleTag } from "@luna/lib";
import { closeEditor, openEditor as openEditorNative } from "./editor.native";

const storage = await ReactiveStore.getPluginStorage("Themer", { css: "" });

export const unloads = new Set<LunaUnload>();

export const openEditor = () => openEditorNative(storage.css);
const style = new StyleTag("Themer", unloads, storage.css);

unloads.add(ipcRenderer.on("THEMER_SET_CSS", (css: string) => (storage.css = style.css = css)));

const onKeyDown = (event: KeyboardEvent) => event.ctrlKey && event.key === "e" && openEditor();
document.addEventListener("keydown", onKeyDown);

unloads.add(closeEditor);
unloads.add(() => document.removeEventListener("keydown", onKeyDown));
