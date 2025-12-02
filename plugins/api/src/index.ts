import { LunaUnload, reduxStore, Tracer } from "@luna/core";
import { ipcRenderer, MediaItem, PlayState, redux, safeInterval } from "@luna/lib";
import { startServer, stopServer, updateFields } from "./index.native";
import { settings } from "./Settings";
export const { trace } = Tracer("[API]");
export const unloads = new Set<LunaUnload>();
export { Settings } from "./Settings";

startServer(settings.port || 24123)

unloads.add(() => {
    stopServer();
});

let oldPort = settings.port;
safeInterval(unloads, () => {
    if (settings.port !== oldPort) {
        oldPort = settings.port;
        stopServer().then(() => {
            startServer(settings.port || 24123);
            trace.msg.log("Restarted server on port", settings.port);
        })
    }
}, 5000);


const updateMediaFields = async (item: MediaItem) => {
    const pItems = item;
    const [album, artist, title, coverUrl, isrc] = await Promise.all([
        pItems.album(),
        pItems.artist(),
        pItems.title(),
        pItems.coverUrl(),
        pItems.isrc()
    ]);
    const { duration, bestQuality, tidalItem } = pItems;
    const items = { album: album?.tidalAlbum, artist: artist?.tidalArtist, track: tidalItem, coverUrl, isrc, duration, bestQuality };
    updateFields(items);
}
MediaItem.fromPlaybackContext().then((item) => item && updateMediaFields(item));
MediaItem.onMediaTransition(unloads, async (item) =>
    updateMediaFields(item)
);
PlayState.onState(unloads, () =>
    updateStateFields()
);
let doesIPCWork = false;
const interval = setInterval(() => {
    updateStateFields();
}, 250);

const updateStateFields = () => {
    const { playing, playTime, repeatMode, lastPlayStart, playQueue, shuffle, currentTime } = PlayState;
    const items: any = { playing, playTime, repeatMode, playQueue, shuffle };
    if (!Number.isNaN(currentTime)) items.currentTime = currentTime;
    if (lastPlayStart && !Number.isNaN(lastPlayStart)) items.lastPlayStart = lastPlayStart;
    const { playbackControls } = redux.store.getState();
    if (playbackControls.volume) items.volume = playbackControls.volume;
    updateFields(items);
}
unloads.add(() => {
    clearInterval(interval);
});

ipcRenderer.on(unloads, "api.playback.control", async (data) => {
    switch (data.action) {
        case "pause":
            PlayState.pause();
            break;
        case "resume":
            PlayState.play();
            break;
        case "toggle":
            if (PlayState.playing) {
                PlayState.pause();
            } else {
                PlayState.play();
            }
            break;
        case "next":
            PlayState.next();
            break;
        case "previous":
            PlayState.previous();
            break;
        case "setRepeatMode":
            if (typeof data.mode === "number") {
                PlayState.setRepeatMode(data.mode);
            }
            break;
        case "setShuffleMode":
            if (typeof data.shuffle === "boolean") {
                if (data.shuffle) {
                    PlayState.setShuffle(true, true);
                } else {
                    PlayState.setShuffle(false, true);
                }
            }
            break;
        case "seek":
            if (typeof data.time === "number") {
                PlayState.seek(data.time);
            }
            break;
        case "volume":
            if (typeof data.volume === "string" && /^[-+]\d+$/.test(data.volume)) {
                const volChange = Number.parseInt(data.volume, 10);
                const currentVol = reduxStore.getState().playbackControls.volume || 0;
                let newVol = currentVol + volChange;
                newVol = Math.max(0, Math.min(100, newVol));
                redux.actions["playbackControls/SET_VOLUME"]({
                    volume: newVol,
                });
            } else if (typeof data.volume === "number" && data.volume >= 0 && data.volume <= 100) {
                redux.actions["playbackControls/SET_VOLUME"]({
                    volume: data.volume,
                });
            }
            break;
        case "playNext":
            if (data.itemId) {
                PlayState.playNext(data.itemId);
            }
            break;
        case "addToQueue":
            const { itemId } = data;
            if (!itemId) return;
            redux.actions["playQueue/ADD_LAST"]({
                context: {
                    type: "UNKNOWN",
                    id: itemId,
                },
                mediaItemIds: [itemId],
            });
            break;
    }
    updateStateFields();
});