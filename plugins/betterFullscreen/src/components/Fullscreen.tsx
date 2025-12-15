import { MediaItem, PlayState } from "@luna/lib";
import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import { unloads } from "..";
import { settings } from "../settings";
import type { Color, EnhancedSyncedLyric } from "../types";
import { getColors, getDominantColor, getLyrics } from "../util";
import { Lyrics } from "./Lyrics";

function useCurrentTime() {
    const [currentTime, setCurrentTime] = useState(PlayState.currentTime);
    const lastTimeRef = useRef(PlayState.currentTime);
    const lastUpdateRef = useRef(performance.now());

    useEffect(() => {
        let animationFrameId: number;

        const update = () => {
            const now = performance.now();
            const stateTime = PlayState.currentTime;
            const isPlaying = PlayState.playing;

            if (stateTime !== lastTimeRef.current) {
                lastTimeRef.current = stateTime;
                lastUpdateRef.current = now;
            }

            if (isPlaying) {
                const elapsed = (now - lastUpdateRef.current) / 1000;
                setCurrentTime(lastTimeRef.current + elapsed);
            } else {
                setCurrentTime(stateTime);
            }

            animationFrameId = requestAnimationFrame(update);
        };

        update();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);
    return currentTime;
}

function useMediaItem() {
    const [mediaItem, setMediaItem] = useState<MediaItem | null>(null);
    useEffect(() => {
        let isCancelled = false;
        MediaItem.fromPlaybackContext().then((item) => {
            if (!isCancelled && item) setMediaItem(item);
        });
        const unsub = MediaItem.onMediaTransition(unloads, async (item) => {
            if (!isCancelled) setMediaItem(item);
        });
        return () => {
            isCancelled = true;
            unsub();
        };
    }, []);
    return mediaItem;
}

function usePlaying() {
    const [isPlaying, setIsPlaying] = useState<boolean>(PlayState.playing);
    useEffect(() => {
        let isCancelled = false;
        const unsub = PlayState.onState(unloads, async (item) => {
            if (!isCancelled) setIsPlaying(PlayState.playing);
        });
        return () => {
            isCancelled = true;
            unsub();
        };
    }, []);
    return isPlaying;
}

export const FullScreen = memo(() => {
    const {
        syncLevel,
        catJam,
        styleTheme,
        showLyricProgress,
        lyricsOffset,
    } = settings;
    const currentTime = useCurrentTime();
    const mediaItem = useMediaItem();
    const playing = usePlaying();
    const [lyrics, setLyrics] = useState<EnhancedSyncedLyric[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorStatus, setErrorStatus] = useState<number | null>(null);
    const [albumArt, setAlbumArt] = useState<string>("");
    const [dominantColor, setDominantColor] = useState<string | null>(null);
    const [gradientColors, setGradientColors] = useState<Color[]>([]);
    const bgVideoRef = useRef<HTMLVideoElement | null>(null);
    const artVideoRef = useRef<HTMLVideoElement | null>(null);
    const currentTrackIdRef = useRef<string | null>(null);

    const coverUrl = mediaItem?.coverUrl;
    const tidalItem = mediaItem?.tidalItem;
    const title = tidalItem?.title;
    const artists = tidalItem?.artists;
    const album = tidalItem?.album;
    const artist = tidalItem?.artist;
    const bpm = tidalItem?.bpm;
    const releaseDate = album?.releaseDate;
    const vibrantColor = album?.vibrantColor;

    if (tidalItem?.id) {
        currentTrackIdRef.current = tidalItem.id as string;
    }

    useEffect(() => {
        if (catJam && catJam !== "None") {
            const src =
                catJam === "CatJam"
                    ? "https://vmohammad.dev/catjam.webm"
                    : catJam === "CatRave"
                        ? "https://vmohammad.dev/catrave.webm"
                        : catJam === "CatRave2"
                            ? "https://vmohammad.dev/catrave2.webm"
                            : "";
            setAlbumArt(src);
            return;
        }
        if (coverUrl) {
            let isCancelled = false;
            coverUrl()
                .then((url) => {
                    if (!isCancelled) {
                        setAlbumArt(url || "");
                        console.log("Fetched album art URL:", url);
                    }
                })
                .catch(() => {
                    if (!isCancelled) {
                        setAlbumArt("");
                    }
                });

            return () => {
                isCancelled = true;
            };
        }
    }, [coverUrl, catJam]);

    useEffect(() => {
        if (
            vibrantColor === "#FFFFFF" &&
            !settings.customVibrantColor &&
            albumArt &&
            (!catJam || catJam === "None")
        ) {
            let isCancelled = false;
            getDominantColor(albumArt)
                .then((color) => {
                    if (!isCancelled) {
                        setDominantColor(color);
                    }
                })
                .catch(() => {
                    if (!isCancelled) {
                        setDominantColor("#FFFFF1");
                    }
                });

            return () => {
                isCancelled = true;
            };
        } else {
            setDominantColor(null);
        }
    }, [vibrantColor, settings.customVibrantColor, albumArt, catJam]);

    useEffect(() => {
        if (
            syncLevel === "Character" &&
            albumArt &&
            (!catJam || catJam === "None")
        ) {
            let isCancelled = false;
            getColors(albumArt)
                .then((colors) => {
                    if (!isCancelled && colors && colors.length > 0) {
                        setGradientColors(colors);
                    }
                })
                .catch(() => {
                    if (!isCancelled) {
                        setGradientColors([]);
                    }
                });

            return () => {
                isCancelled = true;
            };
        } else {
            setGradientColors([]);
        }
    }, [syncLevel, albumArt, catJam]);

    useEffect(() => {
        if (!catJam || catJam === "None") return;
        const baselineBpm = 135.48;
        const trackBpm = typeof bpm === "number" && bpm > 0 ? bpm : baselineBpm;
        const rate = Math.max(0.5, Math.min(2, trackBpm / baselineBpm));

        [bgVideoRef.current, artVideoRef.current].forEach((v) => {
            if (!v) return;
            try {
                v.playbackRate = rate;
                if (playing) {
                    const p = v.play();
                    if (p && typeof p.then === "function") {
                        p.catch(() => { });
                    }
                } else {
                    v.pause();
                }
            } catch (_) { }
        });
    }, [catJam, bpm, playing]);

    useEffect(() => {
        if (tidalItem?.id) {
            setLoading(true);
            setErrorStatus(null);
            let isCancelled = false;
            const trackId = parseInt(tidalItem.id as string, 10);

            getLyrics(trackId)
                .then((lyricsData) => {
                    if (!isCancelled) {
                        setLyrics(lyricsData);
                    }
                })
                .catch((e) => {
                    if (!isCancelled) {
                        setLyrics([]);
                        setErrorStatus(e?.status || 500);
                        console.error("Failed to fetch lyrics for track ID:", trackId, e);
                    }
                })
                .finally(() => {
                    if (!isCancelled) {
                        setLoading(false);
                    }
                });

            return () => {
                isCancelled = true;
            };
        }
    }, [tidalItem?.id]);

    const releaseYear = useMemo(
        () => (releaseDate ? new Date(releaseDate).getFullYear() : ""),
        [releaseDate],
    );

    const artistNames = useMemo(
        () => artists?.map((a) => a.name).join(", ") || artist?.name || "",
        [artists, artist],
    );

    const handleRetry = useCallback(() => {
        if (tidalItem?.id) {
            setLoading(true);
            setErrorStatus(null);
            const trackId = parseInt(tidalItem.id as string, 10);

            getLyrics(trackId)
                .then((lyricsData) => {
                    if (currentTrackIdRef.current === String(trackId)) {
                        setLyrics(lyricsData);
                    }
                })
                .catch((e) => {
                    if (currentTrackIdRef.current === String(trackId)) {
                        setLyrics([]);
                        setErrorStatus(e?.status || 500);
                        console.error("Failed to fetch lyrics for track ID:", trackId, e);
                    }
                })
                .finally(() => {
                    if (currentTrackIdRef.current === String(trackId)) {
                        setLoading(false);
                    }
                });
        }
    }, [tidalItem?.id]);

    const effectiveVibrantColor =
        settings.customVibrantColor || dominantColor || vibrantColor;
    const effectiveCurrentLyricColor =
        settings.currentLyricColor || effectiveVibrantColor;
    if (!mediaItem) {
        return (
            <div className="betterFullscreen-player" data-theme={styleTheme.toLowerCase()}>
                <div className="betterFullscreen-loading">Loading...</div>
            </div>
        );
    }

    return (
        <div
            className="betterFullscreen-player"
            data-theme={styleTheme.toLowerCase()}
            style={
                {
                    "--vibrant-color": effectiveVibrantColor,
                    "--current-lyric-color": effectiveCurrentLyricColor,
                    "--background-blur": `${settings.backgroundBlur}px`,
                    "--vibrant-color-opacity": settings.vibrantColorOpacity,
                    "--text-shadow-intensity": settings.textShadowIntensity,
                    "--animation-speed": settings.animationSpeed,
                    "--enable-floating": settings.enableFloatingAnimation ? "1" : "0",
                    "--enable-pulse": settings.enablePulseEffects ? "1" : "0",
                    "--font-size-scale": settings.fontSizeScale,
                    "--text-opacity": settings.textOpacity,
                    "--padding-scale": settings.paddingScale,
                    "--border-radius": `${settings.borderRadius}px`,
                } as any
            }
        >
            <div className="betterFullscreen-background">
                {catJam !== "None" ? (
                    <video
                        ref={bgVideoRef}
                        src={albumArt}
                        className="betterFullscreen-bg-image"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                    />
                ) : (
                    <img src={albumArt} alt="" className="betterFullscreen-bg-image" />
                )}
                <div className="betterFullscreen-overlay"></div>
            </div>

            <div className="betterFullscreen-content">
                <div className="betterFullscreen-header">
                    <div className="betterFullscreen-album-art">
                        {catJam !== "None" ? (
                            <video
                                ref={artVideoRef}
                                src={albumArt}
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="auto"
                            />
                        ) : (
                            <img
                                src={albumArt}
                                alt={`${album?.title} by ${artists?.map((a) => a.name).join(", ")}`}
                            />
                        )}
                        <div className="betterFullscreen-vinyl-effect"></div>
                    </div>

                    <div className="betterFullscreen-track-info">
                        <h1 className="betterFullscreen-title">{title}</h1>
                        <h2 className="betterFullscreen-artist">{artistNames}</h2>
                        <h3 className="betterFullscreen-album">
                            {album?.title}
                            {releaseYear && (
                                <span className="betterFullscreen-year"> • {releaseYear}</span>
                            )}
                        </h3>
                    </div>
                </div>

                <Lyrics
                    lyrics={lyrics}
                    currentTime={currentTime + lyricsOffset}
                    syncLevel={syncLevel}
                    loading={loading}
                    showLyricProgress={showLyricProgress}
                    gradientColors={gradientColors}
                    onRetry={handleRetry}
                    errorStatus={errorStatus}
                />
            </div>
        </div>
    );
});
FullScreen.displayName = "FullScreen";
