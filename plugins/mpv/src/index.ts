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
import { applyMpvSettings } from "./settings";
export const { trace } = Tracer("[MPV]");
export const unloads = new Set<LunaUnload>();
export { applyMpvSettings, Settings, settings } from "./settings";

let port = 0;
let mpvInitialized = false;
const verbose = false;
const logger = {
    log: (message: string) => verbose ? trace.log(message) : null,
    warn: (message: string) => verbose ? trace.msg.warn(message) : trace.warn(message),
    err: (message: string) => verbose ? trace.msg.err(message) : trace.err(message)
}

startServer().then(async (p) => {
    port = p;
    logger.log(`MPV server started on port ${port}`);

    try {
        await initializePlayer({ verbose });
        muteOrignalPlayer();
        mpvInitialized = true;
        logger.log("MPV player initialized successfully");
        applyMpvSettings();
    } catch (err) {
        logger.err(`Failed to initialize MPV player: ${err}`);
        mpvInitialized = true; // maybe? idk
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
                safeTimeout(unloads, loadPlayQueueIntoMPV, 1500);
            } catch (err) {
                logger.err(`Error loading initial media: ${err}`);
            }
        } else {
            logger.warn("MPV failed to initialize, media loading skipped");
        }
    }
})


window.mpvEnabled = () => { try { return mpvInitialized && port !== 0 } catch { return false } };


declare global {
    interface Window {
        mpvEnabled: () => boolean;
    }
}


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
    mpvInitialized = false;
    port = 0;
});

let oldPlayingState: boolean = false;
let oldPlayTime: number = 0;
let oldVolume: number = 0;
let oldMedia: MediaItem | null = null;
let mpvCurrentTrackId: number | string | null = null;
let mpvNextTrackId: number | string | null = null;
let isAutoNextInProgress = false;

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

        const currentTrackId = currentElement.mediaItemId;
        const nextTrackId = currentIndex + 1 < playQueue.elements.length ?
            playQueue.elements[currentIndex + 1].mediaItemId : null;

        const currentMatches = mpvCurrentTrackId == currentTrackId;
        const nextMatches = mpvNextTrackId == nextTrackId;
        const isSynced = currentMatches && nextMatches;

        if (isSynced && !isAutoNextInProgress) {
            logger.log(`MPV queue is already synced (current: ${currentTrackId}, next: ${nextTrackId}), skipping queue update`);
            return;
        }

        logger.log(`Syncing MPV queue - Current: ${currentTrackId} (was ${mpvCurrentTrackId}), Next: ${nextTrackId} (was ${mpvNextTrackId})`);
        logger.log(`Loading play queue into MPV: ${playQueue.elements.length} tracks, starting at index ${currentIndex}`);

        const currentUrl = `http://localhost:${port}/stream/${currentElement.mediaItemId}`;
        try {
            await setPlayerQueue(currentUrl, undefined, !PlayState.playing);
            mpvCurrentTrackId = currentTrackId;
        } catch (err) {
            logger.err(`Failed to load track ${currentTrackId} into MPV: ${err}`);
            mpvCurrentTrackId = null;
            return;
        }

        isAutoNextInProgress = false;

        if (currentIndex + 1 < playQueue.elements.length) {
            const nextElement = playQueue.elements[currentIndex + 1];
            const nextUrl = `http://localhost:${port}/stream/${nextElement.mediaItemId}`;
            mpvNextTrackId = nextElement.mediaItemId;

            setTimeout(async () => {
                try {
                    await setPlayerQueueNext(nextUrl);
                    logger.log("Next track loaded into MPV queue");
                } catch (err) {
                    logger.warn(`Failed to preload next track: ${err}`);
                }
            }, 1000);
        } else {
            mpvNextTrackId = null;
        }

        logger.log("Current track loaded into MPV successfully");
    } catch (err) {
        logger.err(`Error loading play queue into MPV: ${err}`);
    }
}

const doStuff = async () => {
    if (!mpvInitialized || !port) return;

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
    if (!isAutoNextInProgress) {
        const playQueue = PlayState.playQueue;
        if (playQueue && playQueue.elements && playQueue.elements.length > 0) {
            const currentIndex = playQueue.currentIndex || 0;
            const currentElement = playQueue.elements[currentIndex];

            if (currentElement && mpvCurrentTrackId != currentElement.mediaItemId) {
                logger.log("Play queue changed, resyncing MPV");
                await loadPlayQueueIntoMPV();
            }
        }
    }
});

redux.intercept("playbackControls/SET_VOLUME", unloads, async ({ volume }) => {
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

            if (isAutoNextInProgress) {
                logger.log("Media transition during auto-next, updating tracking variables only");
                mpvCurrentTrackId = media.tidalItem?.id || null;
                const playQueue = PlayState.playQueue;
                if (playQueue && playQueue.elements) {
                    const currentIndex = playQueue.currentIndex || 0;
                    if (currentIndex + 1 < playQueue.elements.length) {
                        const nextElement = playQueue.elements[currentIndex + 1];
                        mpvNextTrackId = nextElement.mediaItemId;

                        const nextUrl = `http://localhost:${port}/stream/${nextElement.mediaItemId}`;
                        safeTimeout(unloads, async () => {
                            try {
                                await setPlayerQueueNext(nextUrl);
                                logger.log("Next track updated in MPV queue after media transition");
                            } catch (err) {
                                logger.warn(`Failed to update next track after media transition: ${err}`);
                            }
                        }, 500);
                    } else {
                        mpvNextTrackId = null;
                    }
                }
                logger.log("Auto-next media transition handling completed");
            } else {
                await new Promise(resolve => setTimeout(resolve, 200));
                await loadPlayQueueIntoMPV();
            }

            oldMedia = media;
        } else if (!media && oldMedia) {
            logger.log("Media cleared, stopping MPV playback");
            await stopPlayer();
            mpvCurrentTrackId = null;
            mpvNextTrackId = null;
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


ipcRenderer.on(unloads, "player.message", (event, message: string) => {
    muteOrignalPlayer();
})
const muteOrignalPlayer = () => {
    ipcRenderer.send("player.message", JSON.stringify({ "command": "media.volume", "volume": 0 }));
    const videoElem = document.querySelector("video");
    if (videoElem) (videoElem as HTMLVideoElement).muted = true;
}

const unmuteOrignalPlayer = () => {
    ipcRenderer.send("player.message", JSON.stringify({ "command": "media.volume", "volume": oldVolume || 50 }));
    const videoElem = document.querySelector("video");
    if (videoElem) (videoElem as HTMLVideoElement).muted = false;
}

unloads.add(() => {
    unmuteOrignalPlayer();
})


safeInterval(unloads, () => {
    if (!mpvInitialized || !port) return;
    muteOrignalPlayer();
    doStuff();
}, 1000);


redux.intercept("player/ERROR", unloads, ({ errorCode }: any) => {
    if (errorCode === "NPD04") {
        return true;
    }
})
const yes = (time?: number) => {
    if (time) ipcRenderer.send("client.playback.playersignal", { signal: 'media.currenttime', time, url: 'https://lgf.audio.tidal.com/mediatracks/yes' })
    ipcRenderer.send("client.playback.playersignal", { signal: 'media.state', state: 'active', url: 'https://lgf.audio.tidal.com/mediatracks/yes' });
}
ipcRenderer.on(unloads, "api.mpv.time", (time) => {
    yes(time);
})
ipcRenderer.on(unloads, "api.mpv.status", async () => {
    if (mpvInitialized && port) {
        try {
            const time = await getPlayerTime();
            yes(time);
        } catch (err) {
            logger.warn(`Failed to get player time for status: ${err}`);
            yes(0);
        }
    } else {
        yes(0);
    }
})
ipcRenderer.on(unloads, "api.mpv.autonext", async () => {
    if (!mpvInitialized || !port) return;

    logger.log("syncing player state");
    isAutoNextInProgress = true;

    try {
        const playQueue = PlayState.playQueue;
        if (!playQueue || !playQueue.elements || playQueue.elements.length === 0) {
            logger.warn("No play queue available");
            isAutoNextInProgress = false;
            return;
        }

        const currentIndex = playQueue.currentIndex || 0;
        const nextIndex = currentIndex + 1;

        if (nextIndex >= playQueue.elements.length) {
            logger.log("Reached end of queue");
            isAutoNextInProgress = false;
            return;
        }

        const nextElement = playQueue.elements[nextIndex];
        logger.log(`Advancing Tidal queue to track ${nextElement.mediaItemId} (index ${nextIndex})`);

        ipcRenderer.send("client.playback.playersignal", {
            signal: 'media.next',
            url: 'https://lgf.audio.tidal.com/mediatracks/trust'
        });

        mpvCurrentTrackId = nextElement.mediaItemId;

        if (nextIndex + 1 < playQueue.elements.length) {
            const followingElement = playQueue.elements[nextIndex + 1];
            mpvNextTrackId = followingElement.mediaItemId;

            setTimeout(async () => {
                try {
                    const nextUrl = `http://localhost:${port}/stream/${followingElement.mediaItemId}`;
                    await setPlayerQueueNext(nextUrl);
                    logger.log("Next track preloaded after auto-next");
                } catch (err) {
                    logger.warn(`Failed to preload next track after auto-next: ${err}`);
                }
            }, 500);
        } else {
            mpvNextTrackId = null;
        }

        logger.log("Tidal player state synced with MPV auto-next");
    } catch (err) {
        logger.err(`Error handling MPV auto-next: ${err}`);
    } finally {
        setTimeout(() => {
            isAutoNextInProgress = false;
        }, 1000);
    }
})
ipcRenderer.on(unloads, "client.playback.playersignal", (payload) => {
    yes(payload?.time);
})