import React, { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { settings } from '../settings';
import { Color, EnhancedSyncedLyric } from '../types';
import { getColors, getDominantColor, getLyrics } from '../util';
import { Lyrics } from './Lyrics';



export const FullScreen = memo(() => {
    const snapshot = useSyncExternalStore(settings.subscribe, settings.getSnapshot);
    const { currentTime, mediaItem, syncLevel, catJam, playing, styleTheme, showLyricProgress } = snapshot;
    const { coverUrl, tidalItem: { title, artists, album, artist, bpm } } = mediaItem!;
    const { releaseDate, vibrantColor } = album!;

    const [lyrics, setLyrics] = useState<EnhancedSyncedLyric[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorStatus, setErrorStatus] = useState<number | null>(null);
    const [albumArt, setAlbumArt] = useState<string>('');
    const [dominantColor, setDominantColor] = useState<string | null>(null);
    const [gradientColors, setGradientColors] = useState<Color[]>([]);
    const bgVideoRef = useRef<HTMLVideoElement | null>(null);
    const artVideoRef = useRef<HTMLVideoElement | null>(null);
    const currentTrackIdRef = useRef<string | null>(null);

    if (mediaItem?.tidalItem?.id) {
        currentTrackIdRef.current = mediaItem.tidalItem.id as string;
    }

    useEffect(() => {
        if (catJam && catJam !== "None") {
            const src =
                catJam === 'CatJam'
                    ? 'https://vmohammad.dev/catjam.webm'
                    : catJam === 'CatRave'
                        ? 'https://vmohammad.dev/catrave.webm'
                        : catJam === 'CatRave2'
                            ? 'https://vmohammad.dev/catrave2.webm'
                            : '';
            setAlbumArt(src);
            return;
        }
        if (coverUrl) {
            let isCancelled = false;
            coverUrl()
                .then(url => {
                    if (!isCancelled) {
                        setAlbumArt(url || '');
                    }
                })
                .catch(() => {
                    if (!isCancelled) {
                        setAlbumArt('');
                    }
                });

            return () => {
                isCancelled = true;
            };
        }
    }, [coverUrl, catJam]);

    useEffect(() => {
        if (vibrantColor === "#FFFFFF" && !snapshot.customVibrantColor && albumArt && (!catJam || catJam === "None")) {
            let isCancelled = false;
            getDominantColor(albumArt)
                .then(color => {
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
    }, [vibrantColor, snapshot.customVibrantColor, albumArt, catJam]);

    useEffect(() => {
        if (syncLevel === 'Character' && albumArt && (!catJam || catJam === "None")) {
            let isCancelled = false;
            getColors(albumArt)
                .then(colors => {
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
        const trackBpm = typeof bpm === 'number' && bpm > 0 ? bpm : baselineBpm;
        const rate = Math.max(0.5, Math.min(2, trackBpm / baselineBpm));

        [bgVideoRef.current, artVideoRef.current].forEach(v => {
            if (!v) return;
            try {
                v.playbackRate = rate;
                if (playing) {
                    const p = v.play();
                    if (p && typeof p.then === 'function') {
                        p.catch(() => { });
                    }
                } else {
                    v.pause();
                }
            } catch (_) {
            }
        });
    }, [catJam, bpm, playing]);

    useEffect(() => {
        if (mediaItem?.tidalItem?.id) {
            setLoading(true);
            setErrorStatus(null);
            let isCancelled = false;
            const trackId = parseInt(mediaItem.tidalItem.id as string, 10);

            getLyrics(trackId)
                .then(lyricsData => {
                    if (!isCancelled) {
                        setLyrics(lyricsData);
                    }
                })
                .catch((e) => {
                    if (!isCancelled) {
                        setLyrics([]);
                        setErrorStatus(e?.status || 500);
                        console.error('Failed to fetch lyrics for track ID:', trackId, e);
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
    }, [mediaItem?.tidalItem?.id]);

    const releaseYear = useMemo(() =>
        releaseDate ? new Date(releaseDate).getFullYear() : '',
        [releaseDate]
    );

    const artistNames = useMemo(() =>
        artists?.map(a => a.name).join(', ') || artist?.name || '',
        [artists, artist]
    );

    const handleRetry = useCallback(() => {
        if (mediaItem?.tidalItem?.id) {
            setLoading(true);
            setErrorStatus(null);
            const trackId = parseInt(mediaItem.tidalItem.id as string, 10);

            getLyrics(trackId)
                .then(lyricsData => {
                    if (currentTrackIdRef.current === String(trackId)) {
                        setLyrics(lyricsData);
                    }
                })
                .catch((e) => {
                    if (currentTrackIdRef.current === String(trackId)) {
                        setLyrics([]);
                        setErrorStatus(e?.status || 500);
                        console.error('Failed to fetch lyrics for track ID:', trackId, e);
                    }
                })
                .finally(() => {
                    if (currentTrackIdRef.current === String(trackId)) {
                        setLoading(false);
                    }
                });
        }
    }, [mediaItem?.tidalItem?.id]);

    const effectiveVibrantColor = snapshot.customVibrantColor || dominantColor || vibrantColor;
    const effectiveCurrentLyricColor = snapshot.currentLyricColor || effectiveVibrantColor;

    return (
        <div className="betterFullscreen-player" data-theme={styleTheme.toLowerCase()} style={{
            '--vibrant-color': effectiveVibrantColor,
            '--current-lyric-color': effectiveCurrentLyricColor,
            '--background-blur': `${snapshot.backgroundBlur}px`,
            '--vibrant-color-opacity': snapshot.vibrantColorOpacity,
            '--text-shadow-intensity': snapshot.textShadowIntensity,
            '--animation-speed': snapshot.animationSpeed,
            '--enable-floating': snapshot.enableFloatingAnimation ? '1' : '0',
            '--enable-pulse': snapshot.enablePulseEffects ? '1' : '0',
            '--font-size-scale': snapshot.fontSizeScale,
            '--text-opacity': snapshot.textOpacity,
            '--padding-scale': snapshot.paddingScale,
            '--border-radius': `${snapshot.borderRadius}px`
        } as any}>
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
                            <img src={albumArt} alt={`${album?.title} by ${artists?.map(a => a.name).join(', ')}`} />
                        )}
                        <div className="betterFullscreen-vinyl-effect"></div>
                    </div>

                    <div className="betterFullscreen-track-info">
                        <h1 className="betterFullscreen-title">{title}</h1>
                        <h2 className="betterFullscreen-artist">
                            {artistNames}
                        </h2>
                        <h3 className="betterFullscreen-album">
                            {album?.title}
                            {releaseYear && <span className="betterFullscreen-year"> • {releaseYear}</span>}
                        </h3>
                    </div>
                </div>

                <Lyrics
                    lyrics={lyrics}
                    currentTime={currentTime}
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
FullScreen.displayName = 'FullScreen';
