import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { settings } from './settings';
import { EnhancedSyncedLyric } from './types';
import { getLyrics } from './util';

export const FullScreen = () => {
    const snapshot = useSyncExternalStore(settings.subscribe, settings.getSnapshot);
    const { currentTime, mediaItem, syncLevel, catJam, playing } = snapshot;
    const { coverUrl, tidalItem: { title, artists, album, artist, bpm } } = mediaItem!;
    const { releaseDate, vibrantColor } = album!;

    const [lyrics, setLyrics] = useState<EnhancedSyncedLyric[]>([]);
    const [loading, setLoading] = useState(false);
    const [albumArt, setAlbumArt] = useState<string>('');
    const bgVideoRef = useRef<HTMLVideoElement | null>(null);
    const artVideoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (catJam) {
            const src = catJam === 'CatRave' ? 'https://vmohammad.dev/catrave.webm' : 'https://vmohammad.dev/catjam.webm';
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
        if (!catJam) return;
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

    const getCurrentLyric = useCallback(() => {
        if (!lyrics.length) return null;

        let left = 0;
        let right = lyrics.length - 1;
        let currentIndex = -1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (lyrics[mid].time <= currentTime) {
                currentIndex = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        if (currentIndex === -1) {
            return {
                current: lyrics[0],
                index: 0,
                next: lyrics[1] || null,
                previous: null
            };
        }

        return {
            current: lyrics[currentIndex],
            index: currentIndex,
            next: lyrics[currentIndex + 1] || null,
            previous: lyrics[currentIndex - 1] || null
        };
    }, [lyrics, currentTime]);

    const getHighlightedContent = useCallback((lyric: EnhancedSyncedLyric) => {
        if (syncLevel === 'Line') {
            return lyric.text;
        }

        if (syncLevel === 'Word' && lyric.words) {
            const activeWordIndex = lyric.words.findIndex(
                w => w.time <= currentTime && currentTime < w.endTime
            );

            const lastFinishedWordIndex = activeWordIndex === -1
                ? lyric.words.findIndex((w, i) => w.endTime > currentTime) - 1
                : -1;

            return lyric.words.map((word, index) => {
                const isActive = word.time <= currentTime && currentTime < word.endTime;
                const isPrevious = activeWordIndex !== -1
                    ? index < activeWordIndex
                    : lastFinishedWordIndex !== -1 && index <= lastFinishedWordIndex;

                const className = isActive
                    ? 'word-active'
                    : isPrevious
                        ? 'word word-previous'
                        : 'word';
                return (
                    <span key={index} className={className}>
                        {word.word}
                        {index < lyric.words.length - 1 ? ' ' : ''}
                    </span>
                );
            });
        }

        if (syncLevel === 'Character' && lyric.words) {
            const nodes: React.ReactNode[] = [];

            const activeWordIndex = lyric.words.findIndex(
                w => w.time <= currentTime && currentTime < w.endTime
            );

            const lastFinishedWordIndex = activeWordIndex === -1
                ? lyric.words.findIndex((w, i) => w.endTime > currentTime) - 1
                : -1;

            lyric.words.forEach((word, wordIndex) => {
                const isActiveWord = word.time <= currentTime && currentTime < word.endTime;
                const isWordPrevious = activeWordIndex !== -1
                    ? wordIndex < activeWordIndex
                    : lastFinishedWordIndex !== -1 && wordIndex <= lastFinishedWordIndex;

                if (isActiveWord && word.characters && word.characters.length > 0) {
                    word.characters.forEach((char, charIndex) => {
                        const isActiveChar = char.time <= currentTime && currentTime < char.endTime;
                        const isCharPrevious = char.endTime <= currentTime;
                        const className = isActiveChar
                            ? 'char-active'
                            : isCharPrevious
                                ? 'char char-current'
                                : 'char';
                        nodes.push(
                            <span key={`w${wordIndex}-c${charIndex}`} className={className}>
                                {char.char}
                            </span>
                        );
                    });
                } else {
                    const className = isWordPrevious
                        ? 'word char-current'
                        : 'word';
                    nodes.push(
                        <span key={`w${wordIndex}`} className={className}>
                            {word.word}
                        </span>
                    );
                }

                if (wordIndex < lyric.words.length - 1) {
                    nodes.push(<span key={`space-${wordIndex}`}> </span>);
                }
            });

            return nodes;
        }

        return lyric.text;
    }, [syncLevel, currentTime]);

    const currentLyric = getCurrentLyric();
    const releaseYear = useMemo(() =>
        releaseDate ? new Date(releaseDate).getFullYear() : '',
        [releaseDate]
    );

    const upcomingLyrics = useMemo(() => {
        if (!currentLyric || !lyrics.length) return [];
        return lyrics.slice(currentLyric.index + 2, currentLyric.index + 5);
    }, [currentLyric, lyrics]);

    const effectiveVibrantColor = snapshot.customVibrantColor || vibrantColor;
    const effectiveCurrentLyricColor = snapshot.currentLyricColor || effectiveVibrantColor;
    return (
        <div className="betterFullscreen-player" style={{
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
                {catJam ? (
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
                        {catJam ? (
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
                            {artists?.map(a => a.name).join(', ') || artist?.name}
                        </h2>
                        <h3 className="betterFullscreen-album">
                            {album?.title}
                            {releaseYear && <span className="betterFullscreen-year"> • {releaseYear}</span>}
                        </h3>
                    </div>
                </div>

                <div className="betterFullscreen-lyrics-container">
                    {loading ? (
                        <div className="betterFullscreen-loading">Loading lyrics...</div>
                    ) : lyrics.length > 0 ? (
                        <div className="betterFullscreen-lyrics">
                            {currentLyric && (
                                <>
                                    {currentLyric.previous && (
                                        <div className="betterFullscreen-lyric previous">
                                            {currentLyric.previous.text}
                                        </div>
                                    )}

                                    <div className="betterFullscreen-lyric current">
                                        {getHighlightedContent(currentLyric.current)}
                                    </div>

                                    {currentLyric.next && (
                                        <div className="betterFullscreen-lyric next">
                                            {currentLyric.next.text}
                                        </div>
                                    )}
                                </>
                            )}

                            {currentLyric && upcomingLyrics.map((lyric, index) => (
                                <div key={currentLyric.index + index + 2} className="betterFullscreen-lyric upcoming">
                                    {lyric.text}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="betterFullscreen-no-lyrics">
                            <div className="betterFullscreen-no-lyrics-icon">♪</div>
                            <div>No lyrics available</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
