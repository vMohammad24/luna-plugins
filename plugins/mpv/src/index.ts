import { LunaUnload, Tracer } from "@luna/core";
import { ipcRenderer, MediaItem, observe, PlayState, redux, safeInterval, safeTimeout } from "@luna/lib";
import {
    getPlayerTime,
    initializePlayer, pausePlayer, playPlayer,
    quitPlayer,
    seekPlayerTo,
    setPlayerQueue,
    setPlayerQueueNext,
    setPlayerVolume,
    startServer,
    stopPlayer,
    stopServer
} from "./index.native";
export const { trace } = Tracer("[MPV]");
export const unloads = new Set<LunaUnload>();
export { Settings } from "./settings";

let port = 0;
let mpvInitialized = false;
const verbose = true;
const logger = {
    log: (message: string) => verbose ? trace.log(message) : null,
    warn: (message: string) => verbose ? trace.msg.warn(message) : trace.warn(message),
    err: (message: string) => verbose ? trace.msg.err(message) : trace.err(message)
}

startServer().then(async (p) => {
    port = p;
    logger.log(`MPV server started on port ${port}`);

    try {
        await initializePlayer({});
        muteOrignalPlayer();
        mpvInitialized = true;
        logger.log("MPV player initialized successfully");
    } catch (err) {
        logger.err(`Failed to initialize MPV player: ${err}`);
        mpvInitialized = false;
    }
}).catch((err) => {
    logger.err(`Failed to start MPV server: ${err}`);
})


MediaItem.fromPlaybackContext().then(async (media) => {
    if (media && port) {
        let retries = 0;
        while (!mpvInitialized && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        if (mpvInitialized) {
            try {
                safeTimeout(unloads, loadPlayQueueIntoMPV, 500);
            } catch (err) {
                logger.err(`Error loading initial media: ${err}`);
            }
        } else {
            logger.warn("MPV failed to initialize, media loading skipped");
        }
    }
})




unloads.add(async () => {
    if (mpvInitialized) {
        try {
            logger.log("Shutting down MPV player");
            await quitPlayer();
        } catch (err) {
            logger.err(`Error shutting down MPV: ${err}`);
        }
    }
    stopServer();
});

let oldPlayingState: boolean = false;
let oldPlayTime: number = 0;
let oldVolume: number = 0;
let oldMedia: MediaItem | null = null;

async function loadPlayQueueIntoMPV() {
    if (!mpvInitialized || !port) return;
    muteOrignalPlayer();

    try {
        const playQueue = PlayState.playQueue;
        if (!playQueue || !playQueue.elements || playQueue.elements.length === 0) {
            logger.warn("No play queue available");
            return;
        }

        const currentIndex = playQueue.currentIndex || 0;
        const currentElement = playQueue.elements[currentIndex];

        if (!currentElement) {
            logger.warn("No current element in play queue");
            return;
        }

        logger.log(`Loading play queue into MPV: ${playQueue.elements.length} tracks, starting at index ${currentIndex}`);

        const currentUrl = `http://localhost:${port}/stream/${currentElement.mediaItemId}`;
        await setPlayerQueue(currentUrl, undefined, !PlayState.playing);

        if (currentIndex + 1 < playQueue.elements.length) {
            const nextElement = playQueue.elements[currentIndex + 1];
            const nextUrl = `http://localhost:${port}/stream/${nextElement.mediaItemId}`;

            setTimeout(async () => {
                try {
                    await setPlayerQueueNext(nextUrl);
                    logger.log("Next track loaded into MPV queue");
                } catch (err) {
                    logger.warn(`Failed to preload next track: ${err}`);
                }
            }, 1000);
        }

        logger.log("Current track loaded into MPV successfully");
    } catch (err) {
        logger.err(`Error loading play queue into MPV: ${err}`);
    }
}

const doStuff = async () => {
    muteOrignalPlayer();
    try {
        const currentPlaying = PlayState.playing;
        const currentPlayTime = PlayState.playTime;
        const { playbackControls } = redux.store.getState();
        const currentVolume = playbackControls.volume || 0;

        if (oldPlayingState !== currentPlaying) {
            if (currentPlaying) {
                logger.log("Starting MPV playback");
                await playPlayer();
            } else {
                logger.log("Pausing MPV playback");
                await pausePlayer();
            }
            oldPlayingState = currentPlaying;
        }

        if (Math.abs(oldVolume - currentVolume) > 0.5) {
            logger.log(`Setting MPV volume to ${currentVolume}`);
            await setPlayerVolume(currentVolume);
            oldVolume = currentVolume;
        }

        if (Math.abs(currentPlayTime - oldPlayTime) > 2) {
            logger.log(`Seeking MPV to ${currentPlayTime}s`);
            await seekPlayerTo(currentPlayTime);
        }
        oldPlayTime = currentPlayTime;

    } catch (err) {
        logger.err(`Error in PlayState handler: ${err}`);
    }
}

PlayState.onState(unloads, async () => {
    if (!mpvInitialized) return;
    await doStuff();
});

redux.intercept("playbackControls/SET_VOLUME", unloads, async ({ volume }) => {
    console.log(`Intercepted volume change to ${volume}`);
    if (!mpvInitialized || !port) return;
    try {
        await setPlayerVolume(volume);
    } catch (err) {
        logger.err(`Error setting MPV volume: ${err}`);
    }
})

MediaItem.onMediaTransition(unloads, async (media) => {
    if (!mpvInitialized || !port) return;
    try {
        if (media && media !== oldMedia) {
            logger.log(`Media transition: ${media.tidalItem?.title} by ${media.tidalItem?.artist?.name}`);
            await new Promise(resolve => setTimeout(resolve, 200));
            await loadPlayQueueIntoMPV();

            oldMedia = media;
        } else if (!media && oldMedia) {
            logger.log("Media cleared, stopping MPV playback");
            await stopPlayer();
            oldMedia = null;
        }
    } catch (err) {
        logger.err(`Error in MediaItem handler: ${err}`);
    }
});


redux.intercept("playbackControls/SET_VOLUME", unloads, async ({ volume }) => {
    if (!mpvInitialized || !port) return;

    try {
        logger.log(`Setting MPV volume to ${volume}`);
        await setPlayerVolume(volume);
    } catch (err) {
        logger.err(`Error setting MPV volume: ${err}`);
    }
})


observe(unloads, "video", (elem) => {
    if (elem) (elem as HTMLVideoElement).muted = true;
})


__ipcRenderer.on("player.message", (event, message: string) => {
    muteOrignalPlayer();
})
const muteOrignalPlayer = () => {
    __ipcRenderer.send("player.message", JSON.stringify({ "command": "media.volume", "volume": 0 }));
    const videoElem = document.querySelector("video");
    if (videoElem) (videoElem as HTMLVideoElement).muted = true;
}

const unmuteOrignalPlayer = () => {
    __ipcRenderer.send("player.message", JSON.stringify({ "command": "media.volume", "volume": oldVolume || 50 }));
    const videoElem = document.querySelector("video");
    if (videoElem) (videoElem as HTMLVideoElement).muted = false;
}

unloads.add(() => {
    unmuteOrignalPlayer();
})


safeInterval(unloads, () => {
    if (!mpvInitialized || !port) return;
    muteOrignalPlayer();
}, 5000)


redux.intercept("player/ERROR", unloads, ({ errorCode }: any) => {
    if (errorCode === "NPD04") {
        return true;
    }
})
const yes = (time?: number) => {
    if (time) ipcRenderer.send("client.playback.playersignal", { signal: 'media.currenttime', time, url: 'https://lgf.audio.tidal.com/mediatracks/yes' })
    ipcRenderer.send("client.playback.playersignal", { signal: 'media.state', state: 'active', url: 'https://lgf.audio.tidal.com/mediatracks/yes' });
}
ipcRenderer.on(unloads, "renderer-player-current-time", (time) => {
    yes(time);
})
ipcRenderer.on(unloads, "renderer-player-state", async (state) => {
    yes(await getPlayerTime());
})

ipcRenderer.on(unloads, "client.playback.playersignal", (payload) => {
    yes(payload?.time);
})