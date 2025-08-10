import { LunaUnload, Tracer } from "@luna/core";
import { ipcRenderer, MediaItem, StyleTag } from "@luna/lib";
import React from "react";
import { createRoot } from "react-dom/client";
import { FullScreen } from "./Fullscreen";
import { settings } from "./settings";
export { Settings } from "./settings";

export const { trace } = Tracer("[BetterFullscreen]");
export const unloads = new Set<LunaUnload>();
const styleTag = new StyleTag("BetterFullscreen", unloads);
ipcRenderer.on(unloads, "window.enter.fullscreen", () => {
    import("file://styles.css?minify").then(m => {
        styleTag.css = m.default;
    })
    setTimeout(() => {
        const parent = document.querySelector(".is-fullscreen.is-now-playing");
        if (parent) {
            const fullscreenElement = parent.querySelector('[class^="_fullscreen_"]');
            if (fullscreenElement) {
                const fullscreenContainer = document.createElement('div');
                fullscreenContainer.className = fullscreenElement.className;
                fullscreenElement.parentNode?.replaceChild(fullscreenContainer, fullscreenElement);
                const root = createRoot(fullscreenContainer);
                root.render(React.createElement(FullScreen));
            }
        }
    }, 100)
})

let doesIPCWork = false;
ipcRenderer.on(unloads, "client.playback.playersignal", (payload) => {
    const { time: currentTime } = payload;
    if (currentTime && !Number.isNaN(currentTime)) {
        settings.currentTime = currentTime;
        doesIPCWork = true;
    }
})

const intreval = setInterval(() => {
    if (doesIPCWork) {
        clearInterval(intreval);
        return;
    }
    const el = document.querySelector('*[data-test="current-time"]')?.getAttribute("datetime");
    if (el) {
        const parsed = el
            .split(":")
            .reverse()
            .map((val) => Number(val))
            .reduce((previous, current, index) => {
                return index === 0 ? current : previous + current * Math.pow(60, index);
            }, 0);
        if (parsed) {
            console.log("Parsed current time from element:", parsed);
            settings.currentTime = parsed;
        }
    }
}, 500);

unloads.add(() => {
    clearInterval(intreval);
    styleTag.remove();
    unloads.clear();
})

MediaItem.fromPlaybackContext().then((item) => settings.mediaItem = item || null);
MediaItem.onMediaTransition(unloads, async (item) =>
    settings.mediaItem = item
);