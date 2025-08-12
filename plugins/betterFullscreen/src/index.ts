import { LunaUnload, Tracer } from "@luna/core";
import { ipcRenderer, MediaItem, observe, PlayState, StyleTag } from "@luna/lib";
import React from "react";
import { createRoot } from "react-dom/client";
import { FullScreen } from "./Fullscreen";
import { settings } from "./settings";
export { Settings } from "./settings";

export const { trace } = Tracer("[BetterFullscreen]");
export const unloads = new Set<LunaUnload>();
const styleTag = new StyleTag("BetterFullscreen", unloads);

const loadCss = () => {
    import("file://styles.css?minify").then(m => {
        styleTag.css = m.default;
    })
}
const enterFullscreen = () => {
    loadCss();
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
}
ipcRenderer.on(unloads, "window.enter.fullscreen", () => {
    enterFullscreen();
})

let lastCheck = 0;
observe(unloads, ".is-fullscreen.is-now-playing", () => {
    if (doesIPCWork) {
        return;
    }
    const parent = document.querySelector(".is-fullscreen.is-now-playing");
    if (parent && Date.now() - lastCheck > 400) {
        const fullscreenElement = parent.querySelector('[class^="_fullscreen_"]');
        let isFullscreenInitialized = false;
        if (fullscreenElement) {
            isFullscreenInitialized = fullscreenElement.querySelector(".betterFullscreen-player")?.classList.contains("betterFullscreen-player") ?? false;
        }
        if (!isFullscreenInitialized) {
            lastCheck = Date.now();
            enterFullscreen();
        } else {
            loadCss();
        }
    }
});

let doesIPCWork = false;
ipcRenderer.on(unloads, "client.playback.playersignal", (payload) => {
    const { time: currentTime } = payload;
    if (currentTime && !Number.isNaN(currentTime)) {
        settings.currentTime = currentTime;
        doesIPCWork = true;
    }
})

const interval = setInterval(() => {
    if (doesIPCWork) {
        clearInterval(interval);
        return;
    }
    settings.currentTime = getCurrentPlaybackTime();
}, 100);

unloads.add(() => {
    clearInterval(interval);
    styleTag.remove();
    unloads.clear();
})

MediaItem.fromPlaybackContext().then((item) => settings.mediaItem = item || null);
MediaItem.onMediaTransition(unloads, async (item) =>
    settings.mediaItem = item
);

let currentTime = 0;
let previousTime = -1;
let lastUpdated = Date.now();
const getCurrentPlaybackTime = (): number => {
    const audioElement = document.querySelector('audio') as HTMLAudioElement;
    if (audioElement && audioElement.currentTime) {
        currentTime = audioElement.currentTime;
        previousTime = -1;
        return currentTime;
    }

    const progressBar = document.querySelector('[data-test="progress-bar"]') as HTMLElement;
    if (progressBar) {
        const ariaValueNow = progressBar.getAttribute('aria-valuenow');
        if (ariaValueNow !== null) {
            const progressTime = Number.parseInt(ariaValueNow);
            const now = Date.now();

            if (progressTime !== previousTime) {
                currentTime = progressTime;
                previousTime = progressTime;
                lastUpdated = now;
            } else if (PlayState.playing) {
                const elapsedSeconds = (now - lastUpdated) / 1000;
                currentTime = progressTime + elapsedSeconds;
            }
            return currentTime;
        } else {
            trace.msg.warn("Progress bar not found or aria-valuenow is null");
            return currentTime;
        }
    }

    return currentTime;
};