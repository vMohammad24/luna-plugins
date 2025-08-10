import { ReactiveStore } from "@luna/core";
import { MediaItem } from "@luna/lib";
import { LunaSelectItem, LunaSelectSetting, LunaSettings, LunaTextSetting } from "@luna/ui";
import React from "react";
import { trace } from ".";
const syncLevelStore = await ReactiveStore.getPluginStorage("BetterFullScreen", {
    syncLevel: "Line" as SyncMode,
    apiURL: "https://api.vmohammad.dev/lyrics/?tidal_id=%s&filter=enhancedLyrics"
});

const listeners = new Set<() => void>();

type SyncMode = "Line" | "Word" | "Character";

let inMemoryState = {
    currentTime: 0,
    mediaItem: null as MediaItem | null
};

let cachedSnapshot = {
    currentTime: inMemoryState.currentTime,
    mediaItem: inMemoryState.mediaItem,
    syncLevel: syncLevelStore.syncLevel,
    apiURL: syncLevelStore.apiURL
};

const updateSnapshot = () => {
    cachedSnapshot = {
        currentTime: inMemoryState.currentTime,
        mediaItem: inMemoryState.mediaItem,
        syncLevel: syncLevelStore.syncLevel,
        apiURL: syncLevelStore.apiURL
    };
};

export const settings = {
    get currentTime() {
        return inMemoryState.currentTime;
    },
    set currentTime(value: number) {
        inMemoryState.currentTime = value;
        updateSnapshot();
        listeners.forEach(listener => listener());
    },

    get mediaItem() {
        return inMemoryState.mediaItem;
    },
    set mediaItem(value: MediaItem | null) {
        inMemoryState.mediaItem = value;
        updateSnapshot();
        listeners.forEach(listener => listener());
    },
    get syncLevel() {
        return syncLevelStore.syncLevel;
    },
    set syncLevel(value: SyncMode) {
        syncLevelStore.syncLevel = value;
        updateSnapshot();
        listeners.forEach(listener => listener());
    },
    get apiURL() {
        return syncLevelStore.apiURL;
    },
    set apiURL(value: string) {
        syncLevelStore.apiURL = value;
        updateSnapshot();
        listeners.forEach(listener => listener());
    },

    subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },

    getSnapshot: () => {
        return cachedSnapshot;
    }
};

export const Settings = () => {
    const [currentMode, setCurrentMode] = React.useState<SyncMode>(syncLevelStore.syncLevel);
    const [currentApiUrl, setCurrentApiUrl] = React.useState<string>(syncLevelStore.apiURL);
    return (
        <LunaSettings>
            <LunaSelectSetting title="Sync Mode" desc="Select the sync mode for lyrics" onChange={(event) => {
                const mode = event.target.value as SyncMode;
                settings.syncLevel = mode;
                setCurrentMode(mode)
                trace.msg.log(`Sync Mode Changed to ${mode}`);
            }} value={currentMode}>
                <LunaSelectItem key="Line" value="Line">
                    Line
                </LunaSelectItem>
                <LunaSelectItem key="Word" value="Word">
                    Word
                </LunaSelectItem>
                <LunaSelectItem key="Character" value="Character">
                    Character
                </LunaSelectItem>
            </LunaSelectSetting>
            <LunaTextSetting title="API URL" desc="The API URL to fetch lyrics from (%s is track id)" value={currentApiUrl} onChange={(event) => {
                let url = event.target.value;
                setCurrentApiUrl(url);
                if (!URL.canParse(url)) {
                    trace.msg.err("Invalid URL format");
                    return;
                }
                syncLevelStore.apiURL = url;
                trace.msg.log(`API URL Changed to ${url}`);
            }} />
        </LunaSettings>
    );
};