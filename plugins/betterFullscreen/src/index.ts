import { LunaUnload, Tracer } from "@luna/core";
import { ipcRenderer, MediaItem, observe, PlayState, redux, safeInterval, safeTimeout, StyleTag } from "@luna/lib";
import React from "react";
import { createRoot } from "react-dom/client";
import { FullScreen } from "./components/Fullscreen";
import { settings } from "./settings";
import { getLyrics } from "./util";
export { Settings } from "./settings";
export { getLyrics };
export const { trace } = Tracer("[BetterFullscreen]");
export const unloads = new Set<LunaUnload>();
const styleTag = new StyleTag("BetterFullscreen", unloads);
const buttonClassName = "betterFullscreen-fullscreen-button";
const loadCss = () => {
    // @ts-expect-error
    import("file://styles.css?minify").then(m => {
        styleTag.css = m.default;
    })
}
const enterFullscreen = () => {
    loadCss();
    removeFullscreenButton?.();
    safeTimeout(unloads, () => {
        const parent = document.querySelector(".is-fullscreen.is-now-playing");
        if (parent) {
            const fullscreenElement = parent.querySelector('[class^="_fullscreen_"]');
            if (fullscreenElement) {
                const fullscreenContainer = document.createElement('div');
                fullscreenContainer.className = fullscreenElement.className;
                fullscreenElement.parentNode?.replaceChild(fullscreenContainer, fullscreenElement);
                const root = createRoot(fullscreenContainer);
                root.render(React.createElement(FullScreen));
                unloads.add(root.unmount.bind(root))
            }
        }
    }, 100)
}
let lastCheck = 0;

const doObserve = () => {
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
}
observe(unloads, ".is-fullscreen.is-now-playing", doObserve);
safeTimeout(unloads, doObserve);

ipcRenderer.on(unloads, "api.mpv.time", (time) => {
    settings.currentTime = settings.currentTime = time;
})

let lastUpdateTime = 0;
const interval = safeInterval(unloads, () => {
    if (window.mpvEnabled?.()) {
        interval();
        return;
    }
    const now = PlayState.currentTime;
    if (Math.abs(now - lastUpdateTime) >= 0.05) {
        lastUpdateTime = now;
        settings.currentTime = now;
    }
}, 100);

unloads.add(styleTag.remove.bind(styleTag))

MediaItem.fromPlaybackContext().then((item) => settings.mediaItem = item || null);
MediaItem.onMediaTransition(unloads, async (item) =>
    settings.mediaItem = item
);
MediaItem.onPreload(unloads, (item) => {
    getLyrics(item.id as number)
})


const addFullscreenButton = () => {
    const parent = document.querySelector('[class^="_moreContainer_"]');
    if (!parent) {
        return;
    }
    const exitFSButton = document.querySelector('[data-test="fullscreen"]') as HTMLButtonElement;
    const exisits = !!document.querySelector(`.${buttonClassName}`);
    if (exitFSButton) {
        if (exisits) removeFullscreenButton?.();
        return;
    }
    if (exisits) {
        return;
    }
    const fullscreenButton = document.createElement("button");
    fullscreenButton.className = buttonClassName;
    fullscreenButton.innerHTML = `<svg class="_icon_77f3f89" viewBox="0 0 24 24"><use href="#player__maximize"></use></svg>`;
    fullscreenButton.title = "Enter fullscreen";
    fullscreenButton.onclick = () => redux.actions["view/REQUEST_FULLSCREEN"]();
    parent.appendChild(fullscreenButton);
}

const removeFullscreenButton = document.querySelector(`.${buttonClassName}`)?.remove

const setFSB = (v: boolean) => {
    if (v) {
        addFullscreenButton();
    } else {
        removeFullscreenButton?.();
    }
}
settings.subscribe(() => {
    if (settings.fullscreenButton) {
        setFSB(true);
    } else {
        setFSB(false);
    }
});

unloads.add(() => {
    removeFullscreenButton?.();
})

PlayState.onState(unloads, () => {
    settings.playing = PlayState.playing;
});