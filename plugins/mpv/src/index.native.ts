import { fetchMediaItemStream } from "@luna/lib.native";
import { exec } from 'child_process';
import { app, BrowserWindow } from "electron";
import { rm } from 'fs/promises';
import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import MpvAPI from 'node-mpv';
import { pid } from "process";
import { promisify } from 'util';
const execAsync = promisify(exec);

let server: Server | null = null;

let mpvInstance: MpvAPI | null = null;
const isWindows = process.platform === 'win32';
const socketPath = isWindows ? `\\\\.\\pipe\\mpvserver-${pid}` : `/tmp/node-mpv-${pid}.sock`;
type MPVNativeSettings = {
    mpvPath?: string;
    extraParameters?: string[];
    properties?: Record<string, any>;
};

let nativeSettings: MPVNativeSettings = {
    mpvPath: undefined,
    extraParameters: undefined,
    properties: undefined,
};

function updateMpvNativeSettings(partial: Partial<MPVNativeSettings>) {
    nativeSettings = { ...nativeSettings, ...partial };
}

const NodeMpvErrorCode = {
    0: 'Unable to load file or stream',
    1: 'Invalid argument',
    2: 'Binary not found',
    3: 'IPC command invalid',
    4: 'Unable to bind IPC socket',
    5: 'Connection timeout',
    6: 'MPV is already running',
    7: 'Could not send IPC message',
    8: 'MPV is not running',
    9: 'Unsupported protocol',
};

type NodeMpvError = {
    errcode: number;
    method: string;
    stackTrace: string;
    verbose: string;
};



function sendToRenderer(channel: string, data?: any) {
    const tidalWindow = BrowserWindow.fromId(1);
    if (!tidalWindow) {
        console.warn("sendToRenderer: BrowserWindow with id 1 not found.");
        return;
    }
    tidalWindow.webContents.removeAllListeners("client.playback.playersignal");
    tidalWindow.webContents.send(`api.mpv.${channel}`, data);
}


async function startServer(port?: number): Promise<number> {
    server = createServer(handleRequest);
    server.listen(port ?? 0);
    const addrInfo = server.address();
    return typeof addrInfo === 'object' ? addrInfo?.port || 0 : Number.parseInt(addrInfo.split(':')[1]) || 0;
}

function stopServer() {
    if (server) {
        server.close(() => {
            server = null;
            console.log("Server has been stopped.");
        });
    }
}

const routers = {
    "/stream": handleStream,
}

function handleRequest(req: IncomingMessage, res: ServerResponse) {
    const url = req.url || "";
    const route = url.startsWith("/stream/") ? "/stream" : (url as keyof typeof routers);
    if (route) {
        const handler = routers[route];
        if (handler) {
            handler(req, res);
            return;
        } else {
            res.statusCode = 404;
            res.end("Not Found (1)");
            return;
        }
    } else {
        res.statusCode = 404;
        res.end("Not Found");
    }
}

async function handleStream(req: IncomingMessage, res: ServerResponse) {
    const trackId = Number.parseInt(req.url?.split("/")[2] || "");
    if (!trackId) {
        res.statusCode = 400;
        res.end("Track ID is required");
        return;
    }



    try {
        const tidalWindow = BrowserWindow.fromId(1);
        if (!tidalWindow) {
            res.statusCode = 503;
            res.end("Tidal window not found");
            return;
        }

        const trackInfo = await tidalWindow.webContents.executeJavaScript(`
            (async () => {
                const { MediaItem } = require("@luna/lib");
                const { PlayState } = require("@luna/lib");
                const playQueue = PlayState.playQueue;
                const queueElement = playQueue?.elements?.find(el => el.mediaItemId === ${trackId});
                
                if (queueElement) {
                    const mediaItem = await MediaItem.fromId(${trackId});
                    if (mediaItem) {
                        const playbackInfo = await mediaItem.playbackInfo();
                        return {
                            mediaItem: mediaItem.tidalItem,
                            playbackInfo: playbackInfo
                        };
                    }
                }
                
                const currentMedia = await MediaItem.fromPlaybackContext();
                if (currentMedia && currentMedia.tidalItem?.id === ${trackId}) {
                    const playbackInfo = await currentMedia.playbackInfo();
                    return {
                        mediaItem: currentMedia.tidalItem,
                        playbackInfo: playbackInfo
                    };
                }
                
                return null;
            })()
        `);

        if (!trackInfo || !trackInfo.mediaItem || !trackInfo.playbackInfo) {
            res.statusCode = 404;
            console.error(`Track with ID ${trackId} not found or no playback info available`);
            res.end("Track not found");
            return;
        }


        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.statusCode = 200;
        res.writeHead(200, { "Content-Type": "audio/mpeg" });

        const stream = await fetchMediaItemStream(trackInfo.playbackInfo);
        stream.pipe(res);

        res.on('error', (err) => {
            console.error("Error in stream response:", err);
        });

    } catch (error) {
        console.error(`Error handling stream for track ${trackId}:`, error);
        res.statusCode = 500;
        res.end("Internal server error");
    }
}

const prefetchPlaylistParams = [
    '--prefetch-playlist=no',
    '--prefetch-playlist=yes',
    '--prefetch-playlist',
];

const DEFAULT_MPV_PARAMETERS = (extraParameters?: string[]) => {
    const parameters = [
        '--idle=yes',
        '--no-config',
        '--load-scripts=no',
        '--no-input-media-keys',
        '--no-input-default-bindings',
        '--script-opts=osc-visibility=no',
        '--no-input-terminal',
        '--title="MPV (ignore)"',
        '--force-media-title="MPV (ignore)"'
    ];

    if (!extraParameters?.some((param) => prefetchPlaylistParams.includes(param))) {
        parameters.push('--prefetch-playlist=yes');
    }

    return parameters;
};

const uniq = (array: string[]) => {
    return Array.from(new Set(array));
};

const createMpv = async (data: {
    binaryPath?: string;
    extraParameters?: string[];
    properties?: Record<string, any>;
    verbose?: boolean;
}): Promise<MpvAPI> => {
    const { binaryPath, extraParameters, properties, verbose } = data;

    const settingsExtraParams = nativeSettings.extraParameters || [];
    const allExtraParams = [...settingsExtraParams, ...(extraParameters || [])];

    const params = uniq([...DEFAULT_MPV_PARAMETERS(allExtraParams), ...allExtraParams]);

    const settingsProperties = nativeSettings.properties || {};
    const allProperties = { ...settingsProperties, ...(properties || {}) };

    const mpv = new MpvAPI(
        {
            audio_only: true,
            auto_restart: false,
            binary: binaryPath || nativeSettings.mpvPath || undefined,
            socket: socketPath,
            time_update: 0.1,
            debug: verbose || false,
            verbose: verbose || false,
        },
        params,
    );


    try {
        await mpv.start();
    } catch (error: any) {
        console.error('mpv failed to start', error);
    } finally {
        if (Object.keys(allProperties).length > 0) {
            await mpv.setMultipleProperties(allProperties);
        }
    }

    mpv.on('status', (status) => {
        if (status.property === 'playlist-pos') {
            if (status.value === -1) {
                mpv?.stop();
            }

            if (status.value !== 0) {
                sendToRenderer('autonext');
            }
        }
        sendToRenderer('status', status);
    });

    mpv.on('resumed', () => {
        sendToRenderer('resumed');
    });

    mpv.on('stopped', () => {
        sendToRenderer('stopped');
    });

    mpv.on('paused', () => {
        sendToRenderer('paused');
    });

    mpv.on('timeposition', (time: number) => {
        sendToRenderer('time', time);
    });

    return mpv;
};

const getMpvInstance = () => {
    return mpvInstance;
};

const quit = async () => {
    const instance = getMpvInstance();
    if (instance) {
        await instance.quit();
        if (!isWindows) {
            await rm(socketPath,);
        }
    }
};

const setAudioPlayerFallback = (isError: boolean) => {
    sendToRenderer('renderer-player-fallback', isError);
};

async function setPlayerProperties(data: Record<string, any>): Promise<void> {
    mpvLog({ action: `Setting properties: ${JSON.stringify(data)}` });
    if (data.length === 0) {
        return;
    }

    try {
        if (data.length === 1) {
            getMpvInstance()?.setProperty(Object.keys(data)[0], Object.values(data)[0]);
        } else {
            getMpvInstance()?.setMultipleProperties(data);
        }
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: `Failed to set properties: ${JSON.stringify(data)}` }, err);
    }
}

async function restartPlayer(data: { extraParameters?: string[]; properties?: Record<string, any> }): Promise<void> {
    try {
        mpvLog({
            action: `Attempting to initialize mpv with parameters: ${JSON.stringify(data)}`,
        });

        getMpvInstance()?.stop();
        getMpvInstance()
            ?.quit()
            .catch((error) => {
                mpvLog({ action: 'Failed to quit existing MPV' }, error);
            });
        mpvInstance = null;

        mpvInstance = await createMpv(data);
        mpvLog({ action: 'Restarted mpv', toast: 'success' });
        setAudioPlayerFallback(false);
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: 'Failed to restart mpv, falling back to web player' }, err);
        restartPlayer(data);
    }
}

async function initializePlayer(data: { extraParameters?: string[]; properties?: Record<string, any>, verbose?: boolean }): Promise<void> {
    try {
        mpvLog({
            action: `Attempting to initialize mpv with parameters: ${JSON.stringify(data)}`,
        });
        mpvInstance = await createMpv(data);
        setAudioPlayerFallback(false);
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: 'Failed to initialize mpv, falling back to web player' }, err);
        setAudioPlayerFallback(true);
    }
}

async function quitPlayer(): Promise<void> {
    try {
        await getMpvInstance()?.stop();
        await quit();
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: 'Failed to quit mpv' }, err);
    } finally {
        mpvInstance = null;
    }
}

async function isPlayerRunning(): Promise<boolean | undefined> {
    return getMpvInstance()?.isRunning();
}

async function cleanUpPlayer(): Promise<void> {
    getMpvInstance()?.stop();
    getMpvInstance()?.clearPlaylist();
}

async function playPlayer(): Promise<void> {
    try {
        await getMpvInstance()?.play();
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: 'Failed to start mpv playback' }, err);
    }
}

async function pausePlayer(): Promise<void> {
    try {
        await getMpvInstance()?.pause();
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: 'Failed to pause mpv playback' }, err);
    }
}

async function stopPlayer(): Promise<void> {
    try {
        await getMpvInstance()?.stop();
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: 'Failed to stop mpv playback' }, err);
    }
}

async function nextTrack(): Promise<void> {
    try {
        await getMpvInstance()?.next();
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: 'Failed to go to next track' }, err);
    }
}

async function previousTrack(): Promise<void> {
    try {
        await getMpvInstance()?.prev();
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: 'Failed to go to previous track' }, err);
    }
}

async function seekPlayer(time: number): Promise<void> {
    try {
        await getMpvInstance()?.seek(time);
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: `Failed to seek by ${time} seconds` }, err);
    }
}

async function seekPlayerTo(time: number): Promise<void> {
    try {
        await getMpvInstance()?.goToPosition(time);
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: `Failed to seek to ${time} seconds` }, err);
    }
}

async function setPlayerQueue(current?: string, next?: string, pause?: boolean): Promise<void> {
    console.log('Setting player queue:', { current, next, pause });
    if (!current && !next) {
        try {
            await getMpvInstance()?.clearPlaylist();
            await getMpvInstance()?.pause();
            return;
        } catch (err: any | NodeMpvError) {
            mpvLog({ action: `Failed to clear play queue` }, err);
        }
    }

    try {
        if (current) {
            try {
                await getMpvInstance()?.load(current, 'replace');
            } catch (error: any | NodeMpvError) {
                mpvLog({ action: `Failed to load current song` }, error);
                throw error;
            }

            if (next) {
                await getMpvInstance()?.load(next, 'append');
            }
        } else {
            console.log('No current track provided, only loading next if available');
        }

        if (pause) {
            await getMpvInstance()?.pause();
        } else if (pause === false) {
            await getMpvInstance()?.play();
        }
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: `Failed to set play queue` }, err);
    }
}


async function setPlayerQueueNext(url?: string): Promise<void> {
    try {
        const size = await getMpvInstance()?.getPlaylistSize();

        if (!size) {
            return;
        }

        if (size > 1) {
            await getMpvInstance()?.playlistRemove(1);
        }

        if (url) {
            await getMpvInstance()?.load(url, 'append');
        }
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: `Failed to set play queue` }, err);
    }
}

async function autoNextPlayer(url?: string): Promise<void> {
    try {
        await getMpvInstance()
            ?.playlistRemove(0)
            .catch(() => {
                getMpvInstance()?.pause();
            });

        if (url) {
            await getMpvInstance()?.load(url, 'append');
        }
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: `Failed to load next song` }, err);
    }
}

async function setPlayerVolume(value: number): Promise<void> {
    try {
        if (Number.isNaN(value) || value < 0 || value > 100) {
            return;
        }
        await getMpvInstance()?.volume(value);
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: `Failed to set volume to ${value}` }, err);
    }
}

async function mutePlayer(mute: boolean): Promise<void> {
    try {
        await getMpvInstance()?.mute(mute);
    } catch (err: any | NodeMpvError) {
        mpvLog({ action: `Failed to set mute status` }, err);
    }
}

async function getPlayerTime(): Promise<number | undefined> {
    try {
        const instance = getMpvInstance();
        if (!instance || !instance.isRunning()) {
            return 0;
        }
        const playlistSize = await instance.getPlaylistSize().catch(() => 0);
        if (!playlistSize || playlistSize === 0) {
            return 0;
        }

        return await instance.getTimePosition();
    } catch (err: any | NodeMpvError) {
        if (err?.errcode !== 3) {
            mpvLog({ action: `Failed to get current time` }, err);
        }
        return 0;
    }
}

enum MpvState {
    STARTED,
    IN_PROGRESS,
    DONE,
}

let mpvState = MpvState.STARTED;

app.on('before-quit', async (event) => {
    switch (mpvState) {
        case MpvState.DONE:
            return;
        case MpvState.IN_PROGRESS:
            event.preventDefault();
            break;
        case MpvState.STARTED: {
            try {
                mpvState = MpvState.IN_PROGRESS;
                event.preventDefault();
                await getMpvInstance()?.stop();
                await quit();
            } catch (err: any | NodeMpvError) {
                mpvLog({ action: `Failed to cleanly before-quit` }, err);
            } finally {
                mpvState = MpvState.DONE;
                app.quit();
            }
            break;
        }
    }
});

const mpvLog = (
    data: { action: string; toast?: 'info' | 'success' | 'warning' },
    err?: NodeMpvError,
) => {
    const { action, toast } = data;

    if (err) {
        const message = `[AUDIO PLAYER] ${action} - mpv errorcode ${err.errcode} - ${NodeMpvErrorCode[err.errcode as keyof typeof NodeMpvErrorCode]
            }`;

        console.error(message, err);
    }

    const message = `[AUDIO PLAYER] ${action}`;
    console.error(message);
};


async function updatePlayerProperties(properties: Record<string, any>): Promise<void> {
    try {
        const instance = getMpvInstance();
        if (instance) {
            await instance.setMultipleProperties(properties);
            console.log(`Updated MPV properties: ${JSON.stringify(properties)}`);
        } else {
            console.warn("MPV instance not available for property updates");
        }
    } catch (err: any) {
        console.error(`Failed to update MPV properties: ${typeof err === 'object' ? JSON.stringify(err, null, 2) : err}`);
    }
}

interface AudioDevice {
    id: string;
    description: string;
}

async function getAvailableAudioDevices(mpvPath?: string): Promise<AudioDevice[]> {
    try {
        const mpvCommand = mpvPath || 'mpv';
        const { stdout } = await execAsync(`"${mpvCommand}" --audio-device=help`);

        const devices: AudioDevice[] = [];
        const lines = stdout.split('\n');

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const match = line.match(/^\s*'([^']+)'\s*\((.+)\)$/);
            if (match) {
                const [, id, description] = match;
                devices.push({ id, description });
            }
        }

        return devices;
    } catch (err) {
        console.error(`Failed to get audio devices: ${err}`);
        return [
            { id: 'auto', description: 'Autoselect device' },
            { id: 'alsa', description: 'Default (alsa)' },
            { id: 'pulse', description: 'Default (pulse)' },
            { id: 'pipewire', description: 'Default (pipewire)' }
        ];
    }
}

export {
    autoNextPlayer, cleanUpPlayer, getAvailableAudioDevices, getMpvInstance, getPlayerTime, initializePlayer, isPlayerRunning, mutePlayer, nextTrack, pausePlayer, playPlayer, previousTrack, quitPlayer, restartPlayer, seekPlayer,
    seekPlayerTo, setPlayerProperties, setPlayerQueue, setPlayerQueueNext, setPlayerVolume, startServer, stopPlayer, stopServer, updateMpvNativeSettings, updatePlayerProperties
};

export type { AudioDevice };

