import { LunaUnload, Tracer } from "@luna/core";
import { MediaItem, PlayState, ipcRenderer, redux } from "@luna/lib";
import { startServer, stopServer, updateFields } from "./index.native";
export const { trace } = Tracer("[API]");
export const unloads = new Set<LunaUnload>();


startServer(24123)

unloads.add(() => {
    stopServer();
});


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
    const { playing, playTime, repeatMode, lastPlayStart, playQueue, shuffle } = PlayState;
    const currentTime = getCurrentPlaybackTime();
    const items: any = { playing, playTime, repeatMode, playQueue, shuffle };
    if (!Number.isNaN(currentTime) && !doesIPCWork) items.currentTime = currentTime;
    if (lastPlayStart && !Number.isNaN(lastPlayStart)) items.lastPlayStart = lastPlayStart;
    const { playbackControls } = redux.store.getState();
    if (playbackControls.volume) items.volume = playbackControls.volume;
    updateFields(items);
}
ipcRenderer.on(unloads, "client.playback.playersignal", (payload) => {
    const { time: currentTime } = payload;
    if (currentTime && !Number.isNaN(currentTime)) {
        updateFields({ currentTime });
        doesIPCWork = true;
    }
})
unloads.add(() => {
    clearInterval(interval);
});

let currentTime = 0;
let previousTime = -1;
let lastUpdated = Date.now();
const getCurrentPlaybackTime = (): number => {
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

ipcRenderer.on(unloads, "api.playback.control", (data) => {
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
            if (typeof data.volume === "number") {
                redux.actions["playbackControls/SET_VOLUME"]({
                    volume: Number.parseInt(data.volume),
                });
            }
            break;
    }
    updateStateFields();
});