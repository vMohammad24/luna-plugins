import { LunaUnload, Tracer } from "@luna/core";
import { MediaItem, PlayState, ipcRenderer, redux } from "@luna/lib";
import {
    PlaybackItems,
    initializePlayer, pausePlayer, playPlayer,
    quitPlayer,
    seekPlayerTo,
    setPlayerQueue,
    setPlayerVolume,
    startServer,
    stopPlayer,
    stopServer,
    updateItems
} from "./index.native";
export const { trace } = Tracer("[MPV]");
export const unloads = new Set<LunaUnload>();
export { Settings } from "./settings";

let port = 0;
let mpvInitialized = false;

startServer().then(async (p) => {
    port = p;
    trace.msg.log(`MPV server started on port ${port}`);

    try {
        await initializePlayer({});
        mpvInitialized = true;
        trace.msg.log("MPV player initialized successfully");
    } catch (err) {
        trace.msg.err(`Failed to initialize MPV player: ${err}`);
        mpvInitialized = false;
    }
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

MediaItem.fromPlaybackContext().then(async (media) => {
    update();

    if (media && port) {
        let retries = 0;
        while (!mpvInitialized && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        if (mpvInitialized) {
            try {
                const trackId = media.tidalItem?.id;
                if (trackId) {
                    const streamUrl = `http://localhost:${port}/stream/${trackId}`;
                    trace.msg.log(`Loading initial track into MPV: ${media.tidalItem?.title} by ${media.tidalItem?.artist?.name}`);
                    setTimeout(async () => {
                        await setPlayerQueue(streamUrl, undefined, !PlayState.playing);
                    }, 500);
                    oldMedia = media;
                }
            } catch (err) {
                trace.msg.err(`Error loading initial media: ${err}`);
            }
        } else {
            trace.msg.warn("MPV failed to initialize, media loading skipped");
        }
    }
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


unloads.add(async () => {
    if (mpvInitialized) {
        try {
            trace.msg.log("Shutting down MPV player");
            await quitPlayer();
        } catch (err) {
            trace.msg.err(`Error shutting down MPV: ${err}`);
        }
    }
    stopServer();
    clearInterval(interval);
});

let oldPlayingState: boolean = false;
let oldPlayTime: number = 0;
let oldVolume: number = 0;
let oldMedia: MediaItem | null = null;

PlayState.onState(unloads, async () => {
    if (!mpvInitialized) return;

    try {
        const currentPlaying = PlayState.playing;
        const currentPlayTime = PlayState.playTime;
        const { playbackControls } = redux.store.getState();
        const currentVolume = playbackControls.volume || 0;

        if (oldPlayingState !== currentPlaying) {
            if (currentPlaying) {
                trace.msg.log("Starting MPV playback");
                await playPlayer();
            } else {
                trace.msg.log("Pausing MPV playback");
                await pausePlayer();
            }
            oldPlayingState = currentPlaying;
        }

        if (Math.abs(oldVolume - currentVolume) > 0.5) {
            trace.msg.log(`Setting MPV volume to ${currentVolume}`);
            await setPlayerVolume(currentVolume);
            oldVolume = currentVolume;
        }

        if (Math.abs(currentPlayTime - oldPlayTime) > 2) {
            trace.msg.log(`Seeking MPV to ${currentPlayTime}s`);
            await seekPlayerTo(currentPlayTime);
        }
        oldPlayTime = currentPlayTime;

    } catch (err) {
        trace.msg.err(`Error in PlayState handler: ${err}`);
    }
});

MediaItem.onMediaTransition(unloads, async (media) => {
    if (!mpvInitialized || !port) return;

    try {
        if (media && media !== oldMedia) {
            const trackId = media.tidalItem?.id;
            if (trackId) {
                setTimeout(async () => {
                    const streamUrl = `http://localhost:${port}/stream/${trackId}`;
                    trace.msg.log(`Loading new track into MPV: ${media.tidalItem?.title} by ${media.tidalItem?.artist?.name} (${streamUrl})`);

                    await new Promise(resolve => setTimeout(resolve, 100));

                    await setPlayerQueue(streamUrl, undefined, !PlayState.playing);

                    oldMedia = media;
                }, 500)
            } else {
                trace.msg.warn("No track ID found for media item");
            }
        } else if (!media && oldMedia) {
            trace.msg.log("Media cleared, stopping MPV playback");
            await stopPlayer();
            oldMedia = null;
        }
    } catch (err) {
        trace.msg.err(`Error in MediaItem handler: ${err}`);
    }
});