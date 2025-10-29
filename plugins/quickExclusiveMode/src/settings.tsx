import { ReactiveStore } from "@luna/core";
import {
    LunaSettings,
    LunaSwitchSetting,
    LunaTextSetting
} from "@luna/ui";
import { debounce } from "@mui/material";
import React from "react";



export const settings = await ReactiveStore.getPluginStorage<{
    keybind: string | null;
    global: boolean;
}>("QuickExclusiveMode", {
    keybind: null,
    global: false
})


export function Settings() {
    const [keybind, setKeybind] = React.useState(settings.keybind ?? null);
    const [global, setGlobal] = React.useState(settings.global ?? false);
    const [isCapturing, setIsCapturing] = React.useState(false);
    const pressedKeys = React.useRef<Set<string>>(new Set());
    const lastPress = React.useRef<number>(0);

    const updateKeybind = React.useMemo(
        () => debounce((combo: string) => {
            setKeybind(settings.keybind = combo);
        }, 150),
        []
    );

    React.useEffect(() => {
        return () => {
            updateKeybind.clear();
        };
    }, [updateKeybind]);

    return <LunaSettings>
        <LunaTextSetting
            title="Keybind"
            desc="Set the key combination to toggle exclusive mode (e.g., Ctrl+E). Click to start capturing."
            value={keybind || "Click to set keybind"}
            onFocus={() => {
                setIsCapturing(true);
                pressedKeys.current.clear();
            }}
            onBlur={() => {
                setIsCapturing(false);
                pressedKeys.current.clear();
                updateKeybind.clear();
            }}
            onKeyDown={(event) => {
                if (!isCapturing) return;
                event.preventDefault();
                event.stopPropagation();

                const key = event.key === " " ? "Space" : event.key;

                if (["Control", "Shift", "Alt", "Meta"].includes(key)) {
                    return;
                }

                pressedKeys.current.add(key);

                const now = Date.now();
                if (now - lastPress.current < 100) {
                    return;
                }
                lastPress.current = now;

                const modifiers: string[] = [];
                if (event.ctrlKey) modifiers.push("Ctrl");
                if (event.shiftKey) modifiers.push("Shift");
                if (event.altKey) modifiers.push("Alt");
                if (event.metaKey) modifiers.push("Meta");

                const nonModifierKeys = Array.from(pressedKeys.current).filter(
                    k => !["Control", "Shift", "Alt", "Meta"].includes(k)
                );

                if (nonModifierKeys.length > 0) {
                    const combo = [...modifiers, ...nonModifierKeys].join("+");
                    updateKeybind(combo);
                }
            }}
            onKeyUp={(event) => {
                if (!isCapturing) return;
                event.preventDefault();
                event.stopPropagation();

                const key = event.key === " " ? "Space" : event.key;
                pressedKeys.current.delete(key);
            }}
        />
        <LunaSwitchSetting
            title="Global Keybind"
            desc="Enable this to allow the keybind to work even when Luna is not focused. (Warning: Will block the keybind system-wide)"
            value={global}
            onChange={(_, value) => {
                setGlobal(settings.global = value);
            }}
        />
    </LunaSettings>;
}