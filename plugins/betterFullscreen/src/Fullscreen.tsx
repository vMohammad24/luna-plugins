import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { settings } from './settings';
import { EnhancedSyncedLyric } from './types';
import { getLyrics } from './util';

export const FullScreen = () => {
    const { currentTime, mediaItem, syncLevel } = useSyncExternalStore(settings.subscribe, settings.getSnapshot);
    const { coverUrl, tidalItem: { title, artists, album, artist } } = mediaItem!;
    const { releaseDate, vibrantColor } = album!;

    const [lyrics, setLyrics] = useState<EnhancedSyncedLyric[]>([]);
    const [loading, setLoading] = useState(false);
    const [albumArt, setAlbumArt] = useState<string>('');

    useEffect(() => {
        if (coverUrl) {
            coverUrl().then(url => setAlbumArt(url || '')).catch(() => setAlbumArt(''));
        }
    }, [coverUrl]);

    useEffect(() => {
        if (mediaItem?.tidalItem?.id) {
            setLoading(true);
            const trackId = parseInt(mediaItem.tidalItem.id as string, 10);
            getLyrics(trackId)
                .then(setLyrics)
                .catch((e) => {
                    setLyrics([]);
                    console.error('Failed to fetch lyrics for track ID:', trackId, e);
                })
                .finally(() => setLoading(false));
        }
    }, [mediaItem?.tidalItem?.id]);

    const getCurrentLyric = () => {
        if (!lyrics.length) return null;

        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (lyrics[i].time <= currentTime) {
                return {
                    current: lyrics[i],
                    index: i,
                    next: lyrics[i + 1] || null,
                    previous: lyrics[i - 1] || null
                };
            }
        }
        return {
            current: lyrics[0],
            index: 0,
            next: lyrics[1] || null,
            previous: null
        };
    };

    const getHighlightedContent = (lyric: EnhancedSyncedLyric) => {
        if (syncLevel === 'Line') {
            return lyric.text;
        }
        if (syncLevel === 'Word' && lyric.words) {
            const activeWordIndex = lyric.words.findIndex(
                w => w.time <= currentTime && currentTime < w.endTime
            );
            return lyric.words.map((word, index) => {
                const isActive = word.time <= currentTime && currentTime < word.endTime;
                const className = isActive
                    ? 'word-active'
                    : `word${activeWordIndex !== -1 && index < activeWordIndex ? ' word-previous' : ''}`;
                return (
                    <span key={index} className={className}>
                        {word.word}
                        {index < lyric.words.length - 1 ? ' ' : ''}
                    </span>
                );
            });
        }

        if (syncLevel === 'Character') {
            const words = lyric.words || [];
            if (!words.length) return lyric.text;

            const activeWordIndex = words.findIndex(
                w => w.time <= currentTime && currentTime < w.endTime
            );

            const nodes: React.ReactNode[] = [];
            words.forEach((w, wi) => {
                const isActiveWord = wi === activeWordIndex;

                if (isActiveWord) {
                    const hasChars = Array.isArray(w.characters) && w.characters.length > 0;
                    const activeCharIdx = hasChars
                        ? w.characters!.findIndex(
                            ch => ch.time <= currentTime && currentTime < ch.endTime
                        )
                        : -1;

                    type CharItem = { char: string; time?: number; endTime?: number };
                    const charItems: CharItem[] = hasChars
                        ? w.characters!.map(ch => ({ char: ch.char, time: ch.time, endTime: ch.endTime }))
                        : Array.from(w.word).map(c => ({ char: c }));

                    charItems.forEach((ch, ci) => {
                        const isActiveChar = ci === activeCharIdx;
                        const isBeforeActive = activeCharIdx !== -1 && ci < activeCharIdx;
                        const className = isActiveChar
                            ? 'char-active'
                            : isBeforeActive
                                ? 'char char-current'
                                : 'char';
                        nodes.push(
                            <span key={`w${wi}-c${ci}`} className={className}>
                                {ch.char}
                            </span>
                        );
                    });
                } else {
                    const isBeforeActiveWord = activeWordIndex !== -1 && wi < activeWordIndex;
                    nodes.push(
                        <span key={`w${wi}`} className={`word${isBeforeActiveWord ? ' char-current' : ''}`}>
                            {w.word}
                        </span>
                    );
                }

                if (wi < words.length - 1) {
                    nodes.push(<span key={`space-${wi}`}>{' '}</span>);
                }
            });

            return nodes;
        }

        return lyric.text;
    };

    const currentLyric = getCurrentLyric();
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '';

    return (
        <div className="betterFullscreen-player" style={{ '--vibrant-color': vibrantColor } as any}>
            <div className="betterFullscreen-background">
                <img src={albumArt} alt="" className="betterFullscreen-bg-image" />
                <div className="betterFullscreen-overlay"></div>
            </div>

            <div className="betterFullscreen-content">
                <div className="betterFullscreen-header">
                    <div className="betterFullscreen-album-art">
                        <img src={albumArt} alt={`${album?.title} by ${artists?.map(a => a.name).join(', ')}`} />
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
                                            {getHighlightedContent(currentLyric.previous)}
                                        </div>
                                    )}

                                    <div className="betterFullscreen-lyric current">
                                        {getHighlightedContent(currentLyric.current)}
                                    </div>

                                    {currentLyric.next && (
                                        <div className="betterFullscreen-lyric next">
                                            {getHighlightedContent(currentLyric.next)}
                                        </div>
                                    )}
                                </>
                            )}

                            {currentLyric && lyrics.slice(currentLyric.index + 2, currentLyric.index + 5).map((lyric, index) => (
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
