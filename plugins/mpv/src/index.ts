import { LunaUnload, Tracer } from "@luna/core";
import { MediaItem, PlayState, ipcRenderer, redux } from "@luna/lib";
import { PlaybackItems, startServer, stopServer, updateItems } from "./index.native";
export const { trace } = Tracer("[MPV]");
export const unloads = new Set<LunaUnload>();


let port = 0;
startServer().then((p) => {
    port = p;
    trace.msg.log(`MPV server started on port ${port}`);
}).catch((err) => {
    trace.msg.err(`Failed to start MPV server: ${err}`);
})


let doesIPCWork = false;


const update = async () => {
    const { playing, playTime, repeatMode, lastPlayStart, playQueue, shuffle } = PlayState;
    const mediaItem = await MediaItem.fromPlaybackContext();
    const currentTime = getCurrentPlaybackTime();
    const items: PlaybackItems = { playing, playTime, repeatMode, playQueue, shuffle };
    if (!Number.isNaN(currentTime) && !doesIPCWork) items.currentTime = currentTime;
    if (lastPlayStart && !Number.isNaN(lastPlayStart)) items.lastPlayStart = lastPlayStart;
    const { playbackControls } = redux.store.getState();
    if (playbackControls.volume) items.volume = playbackControls.volume;
    if (mediaItem) {
        items.mediaItem = mediaItem.tidalItem;
        const playbackInfo = await mediaItem.playbackInfo();
        if (playbackInfo) {
            items.playbackInfo = playbackInfo;
        }
    }
    updateItems(items);
}

const interval = setInterval(() => {
    update();
}, 100);

PlayState.onState(unloads, () => {
    update();
})
MediaItem.fromPlaybackContext().then(() => {
    update();
})
MediaItem.onMediaTransition(unloads, () => {
    update();
});


let currentTime = 0;
let previousTime = -1;
let lastUpdated = Date.now();
const getCurrentPlaybackTime = (): number => {
    if (doesIPCWork) return currentTime;
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

ipcRenderer.on(unloads, "client.playback.playersignal", (payload) => {
    const { time } = payload;
    if (time && !Number.isNaN(time)) {
        doesIPCWork = true;
        currentTime = time;
    }
})


unloads.add(() => {
    stopServer();
    clearInterval(interval);
});

let oldState: PlayState | null = null;
let oldMedia: MediaItem | null = null;
PlayState.onState(unloads, (state) => {

});

MediaItem.onMediaTransition(unloads, (media) => {
    if (media && media !== oldMedia) {

    }
});