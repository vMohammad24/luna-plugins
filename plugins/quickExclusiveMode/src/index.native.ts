import type { LunaUnload } from '@luna/core';
import { globalShortcut } from 'electron';


export const unloads = new Set<LunaUnload>();

let currentAccelerator: string | null = null;

function toElectronAccelerator(keybind: string): string {
    return keybind
        .split('+')
        .map(key => {
            const normalized = key.trim();
            if (normalized.toLowerCase() === 'ctrl') {
                return 'CommandOrControl';
            }
            return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
        })
        .join('+');
}

export function registerGlobalKeybind(keybind: string) {
    if (currentAccelerator) {
        globalShortcut.unregister(currentAccelerator);
    }

    const accelerator = toElectronAccelerator(keybind);

    try {
        const success = globalShortcut.register(accelerator, () => {
            // @ts-ignore
            luna.tidalWindow?.webContents.send('qem.toggle');
        });

        if (success) {
            currentAccelerator = accelerator;
            console.log("Successfully registered global accelerator:", accelerator);
        } else {
            console.error("Failed to register global accelerator:", accelerator);
            currentAccelerator = null;
        }
    } catch (error) {
        console.error("Error registering global accelerator:", accelerator, error);
        currentAccelerator = null;
    }

    unloads.add(() => {
        if (currentAccelerator) {
            globalShortcut.unregister(currentAccelerator);
        }
    });
}

export function unregisterGlobalKeybind() {
    if (currentAccelerator) {
        globalShortcut.unregister(currentAccelerator);
        console.log("Unregistered global accelerator:", currentAccelerator);
        currentAccelerator = null;
    }
}