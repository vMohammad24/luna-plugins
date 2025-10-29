import { LunaUnload, reduxStore, Tracer } from "@luna/core";
import { ipcRenderer, observe, redux, safeInterval } from "@luna/lib";
import HeadsetIcon from '@mui/icons-material/Headset';
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import React from "react";
import { createRoot } from "react-dom/client";
import { registerGlobalKeybind, unregisterGlobalKeybind } from "./index.native";
import { settings } from "./settings";

export const { trace } = Tracer("[QuickExclusiveMode]");
export const unloads = new Set<LunaUnload>();
export { Settings } from "./settings";

let exclusiveMode = await getOriginalMode();
let supportsExclusiveMode = false;


async function getOriginalMode() {
    if (window.mpvEnabled?.()) {
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
function toggleExclusiveMode() {
    exclusiveMode = !exclusiveMode;
    updateIcon();
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
    button.onclick = toggleExclusiveMode;
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


ipcRenderer.on(unloads, "qem.toggle", () => {
    toggleExclusiveMode();
})

let currentKeybindHandler: ((event: KeyboardEvent) => void) | null = null;

function parseKeybind(keybind: string) {
    const keys = keybind.split("+").map(k => k.trim().toLowerCase());
    const modifiers = {
        ctrl: keys.includes("ctrl"),
        shift: keys.includes("shift"),
        alt: keys.includes("alt"),
        meta: keys.includes("meta")
    };
    const nonModifierKeys = keys.filter(k => !["ctrl", "shift", "alt", "meta"].includes(k));
    return { modifiers, nonModifierKeys };
}

function matchesKeybind(event: KeyboardEvent, keybind: string): boolean {
    const { modifiers, nonModifierKeys } = parseKeybind(keybind);
    if (modifiers.ctrl !== event.ctrlKey) return false;
    if (modifiers.shift !== event.shiftKey) return false;
    if (modifiers.alt !== event.altKey) return false;
    if (modifiers.meta !== event.metaKey) return false;

    const pressedKey = event.key === " " ? "space" : event.key.toLowerCase();

    return nonModifierKeys.includes(pressedKey);
}

function registerKeybind(keybind: string | null, global = false) {
    console.log("Registering keybind:", keybind, "global:", global);
    if (currentKeybindHandler) {
        window.removeEventListener("keydown", currentKeybindHandler);
        currentKeybindHandler = null;
    }

    if (global && keybind) {
        registerGlobalKeybind(keybind);
        return;
    }

    unregisterGlobalKeybind();

    if (keybind) {
        currentKeybindHandler = (event: KeyboardEvent) => {
            if (matchesKeybind(event, keybind)) {
                event.preventDefault();
                event.stopPropagation();
                toggleExclusiveMode();
            }
        };
        window.addEventListener("keydown", currentKeybindHandler);
        unloads.add(() => {
            if (currentKeybindHandler) {
                window.removeEventListener("keydown", currentKeybindHandler);
            }
        });
    }
}

let lastKeybind: string | null = null;
let lastIsGlobal = false;

safeInterval(unloads, () => {
    const currentKeybind = settings.keybind;
    const currentIsGlobal = settings.global ?? false;

    if (currentKeybind !== lastKeybind || currentIsGlobal !== lastIsGlobal) {
        lastKeybind = currentKeybind;
        lastIsGlobal = currentIsGlobal;
        registerKeybind(currentKeybind, currentIsGlobal);
    }
}, 1000);

registerKeybind(settings.keybind, settings.global ?? false);