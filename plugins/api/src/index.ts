import { LunaUnload, reduxStore, Tracer } from "@luna/core";
import { ipcRenderer, MediaItem, PlayState, redux, safeInterval } from "@luna/lib";
import { startServer, stopServer, updateFields } from "./index.native";
import { settings } from "./Settings";

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

const playbackActions: Record<string, (data: any) => void> = {
    pause: PlayState.pause,
    resume: PlayState.play,
    toggle: () => (PlayState.playing ? PlayState.pause() : PlayState.play()),
    next: PlayState.next,
    previous: PlayState.previous,
    setRepeatMode: (data) => typeof data.mode === "number" && PlayState.setRepeatMode(data.mode),
    setShuffleMode: (data) => typeof data.shuffle === "boolean" && PlayState.setShuffle(data.shuffle, true),
    seek: (data) => typeof data.time === "number" && PlayState.seek(data.time),
    volume: (data) => handleVolumeChange(data.volume),
    playNext: (data) => data.itemId && PlayState.playNext(data.itemId),
    addToQueue: (data) => data.itemId && addToQueue(data.itemId),
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

ipcRenderer.on(unloads, "api.playback.control", async (data) => {
    playbackActions[data.action]?.(data);
    updateStateFields();
});

