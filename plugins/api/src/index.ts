import { LunaUnload, reduxStore, Tracer } from "@luna/core";
import { ipcRenderer, MediaItem, PlayState, redux, safeInterval } from "@luna/lib";
import { startServer, stopServer, updateFields } from "./index.native";
import { settings } from "./Settings";
import type { ActionData, ActionHandler } from "./types";

declare global {
    interface Window {
        __apiInvokeAction?: (data: ActionData & { action: string }) => Promise<unknown>;
    }
}

const stateUpdateInt = 250;
const portCheckInt = 5000;

export const { trace } = Tracer("[API]");
export const unloads = new Set<LunaUnload>();
export { Settings } from "./Settings";

const updateMediaFields = async (item: MediaItem | undefined) => {
    if (!item) return;

    const [album, artist, coverUrl, isrc] = await Promise.all([
        item.album(),
        item.artist(),
        item.coverUrl(),
        item.isrc()
    ]);

    updateFields({
        album: album?.tidalAlbum,
        artist: artist?.tidalArtist,
        track: item.tidalItem,
        coverUrl,
        isrc,
        duration: item.duration,
        bestQuality: item.bestQuality
    });
};

const updateStateFields = () => {
    const { playing, playTime, repeatMode, lastPlayStart, playQueue, shuffle, currentTime } = PlayState;
    const { playbackControls } = redux.store.getState();

    const state: Record<string, unknown> = { playing, playTime, repeatMode, playQueue, shuffle };

    if (!Number.isNaN(currentTime)) state.currentTime = currentTime;
    if (lastPlayStart && !Number.isNaN(lastPlayStart)) state.lastPlayStart = lastPlayStart;
    if (playbackControls.volume) state.volume = playbackControls.volume;

    updateFields(state);
};

const setVolume = (volume: number) => {
    redux.actions["playbackControls/SET_VOLUME"]({ volume });
};

const handleVolumeChange = (volume: string | number) => {
    if (typeof volume === "string" && /^[-+]\d+$/.test(volume)) {
        const currentVol = reduxStore.getState().playbackControls.volume || 0;
        const newVol = Math.max(0, Math.min(100, currentVol + Number.parseInt(volume, 10)));
        setVolume(newVol);
    } else if (typeof volume === "number" && volume >= 0 && volume <= 100) {
        setVolume(volume);
    }
};

const addToQueue = (itemId: string) => {
    redux.actions["playQueue/ADD_LAST"]({
        context: { type: "UNKNOWN", id: itemId },
        mediaItemIds: [itemId],
    });
};

const rendererActions: Record<string, (data: ActionData) => unknown> = {
    pause: PlayState.pause,
    resume: () => PlayState.play(),
    toggle: () => (PlayState.playing ? PlayState.pause() : PlayState.play()),
    next: PlayState.next,
    previous: PlayState.previous,
    setRepeatMode: (data) => typeof data.mode === "number" && PlayState.setRepeatMode(data.mode),
    setShuffleMode: (data) => {
        if (typeof data.shuffle === "boolean") {
            data.shuffle ? PlayState.setShuffle(true, true) : PlayState.setShuffle(false, true);
        }
    },
    seek: (data) => typeof data.time === "number" && PlayState.seek(data.time),
    volume: (data) => handleVolumeChange(data.volume as string | number),
    playNext: (data) => data.itemId && PlayState.playNext(data.itemId as string),
    addToQueue: (data) => data.itemId && addToQueue(data.itemId as string),
};

startServer(settings.port);
unloads.add(stopServer.bind(null));

let lastPort = settings.port;
safeInterval(unloads, () => {
    if (settings.port !== lastPort) {
        lastPort = settings.port;
        stopServer().then(() => {
            startServer(settings.port);
            trace.msg.log("Restarted server on port", settings.port);
        });
    }
}, portCheckInt);

MediaItem.fromPlaybackContext().then(updateMediaFields);
MediaItem.onMediaTransition(unloads, updateMediaFields);
PlayState.onState(unloads, updateStateFields);
safeInterval(unloads, updateStateFields, stateUpdateInt);

window.__apiInvokeAction = async (data: ActionData & { action: string }) => {
    const handler = rendererActions[data.action];
    if (handler) {
        const result = await handler(data);
        updateStateFields();
        return result;
    }
    return undefined;
};
unloads.add(() => {
    delete window.__apiInvokeAction;
});

ipcRenderer.on(unloads, "api.playback.control", async (data) => {
    rendererActions[data.action]?.(data);
    updateStateFields();
});




/**
 * Register a new action handler for the API.
 * @param unloadsFn - Your plugin unloads set
 * @param name - The action name (used in HTTP/WebSocket requests)
 * @param handler - The function to execute when the action is triggered
 * @returns A function to unregister the action (same one is added to unloadsFn so do NOT call it manually unless you want to remove it early)
 */
export const registerAction = (
    unloadsFn: Set<LunaUnload>,
    name: string,
    handler: ActionHandler
) => {
    if (rendererActions[name]) {
        trace.msg.warn(`Action "${name}" already exists, overwriting`);
    }
    let registered = true;
    rendererActions[name] = handler;
    const unregister = () => {
        if (registered) {
            registered = false;
            delete rendererActions[name];
        }
    };
    unloadsFn.add(unregister);
    unloads.add(unregister);
    return unregister;
};


export type { ActionData, ActionHandler } from "./types";
export { updateFields as updateAPIFields };

