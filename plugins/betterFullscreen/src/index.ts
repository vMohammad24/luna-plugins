import { LunaUnload, Tracer } from "@luna/core";
import { ipcRenderer, MediaItem, observe, PlayState, safeInterval, safeTimeout, StyleTag } from "@luna/lib";
import React from "react";
import { createRoot } from "react-dom/client";
import { FullScreen } from "./components/Fullscreen";
import { settings } from "./settings";
import { getLyrics } from "./util";
export { Settings } from "./settings";

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
    removeFullscreenButton();
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

// if i dont put it in a timeout, it errors for some reason
safeTimeout(unloads, doObserve);

let doesIPCWork = false;
ipcRenderer.on(unloads, "client.playback.playersignal", (payload) => {
    const { time: currentTime } = payload;
    if (currentTime && !Number.isNaN(currentTime)) {
        settings.currentTime = currentTime;
        doesIPCWork = true;
    }
})

ipcRenderer.on(unloads, "api.mpv.time", (time) => {
    settings.currentTime = settings.currentTime = time;
})

const interval = safeInterval(unloads, () => {
    if (doesIPCWork || ('mpvEnabled' in window && window.mpvEnabled())) {
        interval();
        return;
    }
    settings.currentTime = getCurrentPlaybackTime();
}, 100);

unloads.add(() => {
    styleTag.remove();
    unloads.clear();
})

MediaItem.fromPlaybackContext().then((item) => settings.mediaItem = item || null);
MediaItem.onMediaTransition(unloads, async (item) =>
    settings.mediaItem = item
);
MediaItem.onPreload(unloads, (item) => {
    getLyrics(item.id as number)
})

let currentTime = 0;
let previousTime = -1;
let lastUpdated = Date.now();
let mpvTime = 0;
const getCurrentPlaybackTime = (): number => {
    if ('mpvEnabled' in window && window.mpvEnabled()) return mpvTime;
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

const addFullscreenButton = () => {
    const parent = document.querySelector('[class^="_moreContainer_"]');
    if (!parent) {
        return;
    }
    const exitFSButton = document.querySelector('[data-test="fullscreen"]') as HTMLButtonElement;
    const exisits = !!document.querySelector(`.${buttonClassName}`);
    if (exitFSButton) {
        if (exisits) removeFullscreenButton();
        return;
    }
    if (exisits) {
        return;
    }
    const fullscreenButton = document.createElement("button");
    fullscreenButton.className = buttonClassName;
    fullscreenButton.innerHTML = `<svg class="_icon_77f3f89" viewBox="0 0 24 24"><use href="#player__maximize"></use></svg>`;
    fullscreenButton.title = "Enter fullscreen";
    fullscreenButton.onclick = () => {
        const footer = document.querySelector('[data-test="footer-player"]') as HTMLDivElement;
        const enterFs = () => {
            const fs = document.querySelector('[data-test="request-fullscreen"]') as HTMLButtonElement;
            if (fs) {
                fs.click();
                return true;
            } else {
                return false;
            }
        }
        if (!enterFs()) {
            footer.click();
            safeTimeout(unloads, () => {
                if (!enterFs()) {
                    trace.msg.warn("Failed to enter fullscreen mode");
                }
            }, 50);
        }

    }

    parent.appendChild(fullscreenButton);
}

const removeFullscreenButton = () => {
    const button = document.querySelector(`.${buttonClassName}`);
    if (button) {
        button.remove();
    }
}

const setFSB = (v: boolean) => {
    if (v) {
        addFullscreenButton();
    } else {
        removeFullscreenButton();
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
    removeFullscreenButton();
})

PlayState.onState(unloads, () => {
    settings.playing = PlayState.playing;
});