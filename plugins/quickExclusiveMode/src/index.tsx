import { LunaUnload, reduxStore, Tracer } from "@luna/core";
import { observe, redux, safeInterval } from "@luna/lib";
import HeadsetIcon from '@mui/icons-material/Headset';
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import React from "react";
import { createRoot } from "react-dom/client";

export const { trace } = Tracer("[QuickExclusiveMode]");
export const unloads = new Set<LunaUnload>();


let exclusiveMode = await getOriginalMode();
let supportsExclusiveMode = false;


async function getOriginalMode() {
    if ("mpvEnabled" in window && window.mpvEnabled()) {
        return import("../../mpv/src").then(({ settings }) => {
            supportsExclusiveMode = true;
            return settings.audioExclusive || false;
        });
    } else {
        try {
            const mode = reduxStore.getState().player.activeDeviceMode;
            if (mode) supportsExclusiveMode = true;
            return mode === "exclusive";
        } catch {
            return false;
        }
    }
}

function updateIcon() {
    const button = document.querySelector('.quick-exclusive-mode-button');
    if (!button) return;
    if (button && !supportsExclusiveMode) {
        button.setAttribute('disabled', 'true');
        return;
    } else {
        button.removeAttribute('disabled');
    }
    button.setAttribute('title', exclusiveMode ? 'Disable Exclusive Mode' : 'Enable Exclusive Mode');
    button.setAttribute('aria-label', exclusiveMode ? 'Disable Exclusive Mode' : 'Enable Exclusive Mode');
    const root = createRoot(button);
    root.render(exclusiveMode ? <HeadsetIcon /> : <HeadsetOffIcon />);
}
function onClick() {
    exclusiveMode = !exclusiveMode;
    updateIcon();
    // trace.msg.log("Toggled exclusive mode:", exclusiveMode ? "ON" : "OFF");
    if ("mpvEnabled" in window && window.mpvEnabled()) {
        import("../../mpv/src").then(({ settings, applyMpvSettings }) => {
            settings.audioExclusive = exclusiveMode;
            applyMpvSettings();
        });
    } else {
        redux.actions["player/SET_DEVICE_MODE"](exclusiveMode ? "exclusive" : "shared");
    }
}

observe(unloads, '[class*="_moreContainer_"]', (elem) => {
    const parent = elem;
    if (!parent) return;
    if (parent.querySelector('.quick-exclusive-mode-button')) return;
    const button = document.createElement('button');
    button.className = button.className + ' quick-exclusive-mode-button';
    button.setAttribute('aria-label', 'Quick Exclusive Mode');
    button.setAttribute('data-test', 'exclusive');
    button.setAttribute('title', 'exclusive');
    button.setAttribute('role', 'button');
    button.onclick = onClick;
    button.innerHTML = '';
    updateIcon();
    parent.appendChild(button);
    unloads.add(() => {
        button.remove();
    })
})

safeInterval(unloads, () => {
    getOriginalMode().then((mode) => {
        exclusiveMode = mode;
        updateIcon();
    });
}, 1000);