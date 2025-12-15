import React, { memo, useCallback, useMemo } from 'react';
import { Color, EnhancedSyncedLyric, SyncedCharacter, SyncedWord } from '../types';

const CHARS_PER_COLOR = 7;
const colorCache = new Map<string, string>();

const interpolateColor = (color1: string, color2: string, factor: number): string => {
    const roundedFactor = Math.round(factor * 100) / 100;
    const cacheKey = `${color1}${color2}${roundedFactor}`;

    let result = colorCache.get(cacheKey);
    if (result) return result;

    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);

    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);

    const r = Math.round(r1 + (r2 - r1) * roundedFactor);
    const g = Math.round(g1 + (g2 - g1) * roundedFactor);
    const b = Math.round(b1 + (b2 - b1) * roundedFactor);

    result = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    if (colorCache.size > 1000) colorCache.clear();
    colorCache.set(cacheKey, result);

    return result;
};

const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const Character = memo(({ char, index, status, totalChars, colors }: {
    char: SyncedCharacter;
    index: number;
    status: 'active' | 'word-active' | 'previous' | 'upcoming';
    totalChars: number;
    colors: Color[];
}) => {
    const position = index / CHARS_PER_COLOR;
    const colorIndex = Math.floor(position) % colors.length;
    const nextColorIndex = (colorIndex + 1) % colors.length;

    const color = colors[colorIndex];
    const nextColor = colors[nextColorIndex];
    const progress = position % 1;

    const interpolatedColor = interpolateColor(color.readableHex, nextColor.readableHex, progress);
    const isComplex = RTL_REGEX.test(char.char);

    const style = {
        color: status === 'active' || status === 'word-active' ? interpolatedColor : 'inherit',
        ['--char-color' as any]: interpolatedColor
    };

    let className = 'char';
    if (isComplex) className += ' char-connected';

    if (status === 'active') className += ' char-active';
    else if (status === 'word-active') className += ' char-word-active';
    else if (status === 'previous') className += ' char-previous';
    else className += ' char-upcoming';

    return (
        <span className={className} style={style}>
            {char.char}
        </span>
    );
}, (prev, next) =>
    prev.status === next.status &&
    prev.index === next.index &&
    prev.char.char === next.char.char
);
Character.displayName = 'Character';

const Word = memo(({ word, index, isActive, isPrevious, totalWords }: {
    word: SyncedWord;
    index: number;
    isActive: boolean;
    isPrevious: boolean;
    totalWords: number;
}) => {
    const className = isActive ? 'word-active' : isPrevious ? 'word word-previous' : 'word';
    return (
        <span className={className}>
            {word.word}
            {index < totalWords - 1 ? ' ' : ''}
        </span>
    );
}, (prev, next) =>
    prev.isActive === next.isActive &&
    prev.isPrevious === next.isPrevious &&
    prev.word.word === next.word.word
);
Word.displayName = 'Word';

const LyricLine = memo(({
    lyric,
    type,
    syncLevel,
    currentTime,
    getHighlightedContent,
    nextLyricTime,
    showProgress
}: {
    lyric: EnhancedSyncedLyric;
    type: 'previous' | 'current' | 'next' | 'upcoming';
    syncLevel: string;
    currentTime: number;
    getHighlightedContent: (lyric: EnhancedSyncedLyric) => React.ReactNode;
    nextLyricTime?: number;
    showProgress?: boolean;
}) => {
    const content = useMemo(() => {
        if (type === 'current') {
            return getHighlightedContent(lyric);
        }
        return lyric.text;
    }, [lyric, type, getHighlightedContent]);

    const progress = useMemo(() => {
        if (type !== 'current' || !nextLyricTime) return 0;
        const duration = nextLyricTime - lyric.time;
        const elapsed = currentTime - lyric.time;
        return Math.min(Math.max((elapsed / duration) * 100, 0), 100);
    }, [type, lyric.time, currentTime, nextLyricTime]);

    const isRtl = useMemo(() => {
        return RTL_REGEX.test(lyric.text);
    }, [lyric.text]);

    const shouldShowProgress = showProgress && type === 'current' && lyric.words && lyric.words.length > 0 && nextLyricTime;

    return (
        <div className={`betterFullscreen-lyric ${type}`} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            {content}
            {shouldShowProgress && (
                <div className="betterFullscreen-lyric-progress">
                    <div
                        className="betterFullscreen-lyric-progress-bar"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
});
LyricLine.displayName = 'LyricLine';

interface LyricsProps {
    lyrics: EnhancedSyncedLyric[];
    currentTime: number;
    syncLevel: string;
    loading: boolean;
    showLyricProgress: boolean;
    gradientColors: Color[];
    onRetry?: () => void;
    errorStatus?: number | null;
}

export const Lyrics = memo(({
    lyrics,
    currentTime,
    syncLevel,
    loading,
    showLyricProgress,
    gradientColors,
    onRetry,
    errorStatus
}: LyricsProps) => {
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
        if (syncLevel === 'Character' && lyric.words && gradientColors.length > 0) {
            const allCharacters: (SyncedCharacter & { wordIndex: number })[] = [];
            lyric.words.forEach((word, wordIdx) => {
                let chars = word.characters;
                if (!chars || chars.length === 0) {
                    const duration = word.endTime - word.time;
                    const charDuration = duration / word.word.length;
                    chars = word.word.split('').map((c, i) => ({
                        char: c,
                        time: word.time + (i * charDuration),
                        endTime: word.time + ((i + 1) * charDuration)
                    }));
                }

                if (chars.length > 0) {
                    const charsWithIndex = chars.map(c => ({ ...c, wordIndex: wordIdx }));
                    allCharacters.push(...charsWithIndex);
                    if (wordIdx < lyric.words.length - 1) {
                        allCharacters.push({
                            char: ' ',
                            time: word.endTime,
                            endTime: lyric.words[wordIdx + 1].time,
                            wordIndex: wordIdx
                        });
                    }
                }
            });

            if (allCharacters.length === 0) {
                return lyric.text;
            }

            const activeWordIndex = lyric.words.findIndex(
                w => w.time <= currentTime && currentTime < w.endTime
            );

            const activeCharIndex = allCharacters.findIndex(
                c => c.time <= currentTime && currentTime < c.endTime
            );

            const charElements: React.ReactNode[] = [];
            let currentWordChars: React.ReactNode[] = [];
            let currentWordHasComplexChar = false;

            allCharacters.forEach((char, index) => {
                let status: 'active' | 'word-active' | 'previous' | 'upcoming' = 'upcoming';

                const isComplex = RTL_REGEX.test(char.char);
                if (isComplex) {
                    currentWordHasComplexChar = true;
                }

                if (activeWordIndex !== -1) {
                    if (char.wordIndex < activeWordIndex) {
                        status = 'previous';
                    } else if (char.wordIndex > activeWordIndex) {
                        status = 'upcoming';
                    } else {

                        if (index === activeCharIndex) {
                            status = 'active';
                        } else if (index < activeCharIndex) {
                            status = 'word-active';
                        } else {
                            status = 'word-active';
                        }
                    }
                } else {

                    const lastFinishedWordIndex = lyric.words.findIndex((w) => w.endTime > currentTime) - 1;
                    if (char.wordIndex <= lastFinishedWordIndex) {
                        status = 'previous';
                    } else {
                        status = 'upcoming';
                    }
                }

                const charComponent = (
                    <Character
                        key={index}
                        char={char}
                        index={index}
                        status={status}
                        totalChars={allCharacters.length}
                        colors={gradientColors}
                    />
                );

                if (char.char === ' ') {
                    if (currentWordChars.length > 0) {
                        charElements.push(
                            <span key={`word-${index}`} style={{
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                                direction: currentWordHasComplexChar ? 'rtl' : 'ltr'
                            }}>
                                {currentWordChars}
                            </span>
                        );
                        currentWordChars = [];
                        currentWordHasComplexChar = false;
                    }
                    charElements.push(charComponent);
                } else {
                    currentWordChars.push(charComponent);
                }
            });

            if (currentWordChars.length > 0) {
                charElements.push(
                    <span key={`word-last`} style={{
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        direction: currentWordHasComplexChar ? 'rtl' : 'ltr'
                    }}>
                        {currentWordChars}
                    </span>
                );
            }

            return charElements;
        }

        if (syncLevel === 'Word' && lyric.words) {
            const activeWordIndex = lyric.words.findIndex(
                w => w.time <= currentTime && currentTime < w.endTime
            );

            const lastFinishedWordIndex = activeWordIndex === -1
                ? lyric.words.findIndex((w) => w.endTime > currentTime) - 1
                : -1;

            const allFinished =
                lyric.words.length > 0 &&
                currentTime >= lyric.words[lyric.words.length - 1].endTime;

            return lyric.words.map((word, index) => {
                const isActive = !allFinished && (word.time <= currentTime && currentTime < word.endTime);
                const isPrevious = allFinished || (activeWordIndex !== -1
                    ? index < activeWordIndex
                    : lastFinishedWordIndex !== -1 && index <= lastFinishedWordIndex);

                return (
                    <Word
                        key={index}
                        word={word}
                        index={index}
                        isActive={isActive}
                        isPrevious={isPrevious}
                        totalWords={lyric.words.length}
                    />
                );
            });
        }
        return lyric.text;
    }, [syncLevel, currentTime, gradientColors]);

    const currentLyric = useMemo(() => getCurrentLyric(), [getCurrentLyric]);

    const upcomingLyrics = useMemo(() => {
        if (!currentLyric || !lyrics.length) return [];
        return lyrics.slice(currentLyric.index + 2, currentLyric.index + 5);
    }, [currentLyric, lyrics]);

    return (
        <div className="betterFullscreen-lyrics-container">
            {loading ? (
                <div className="betterFullscreen-loading">Loading lyrics...</div>
            ) : lyrics.length > 0 ? (
                <div className="betterFullscreen-lyrics">
                    {currentLyric && (
                        <>
                            {currentLyric.previous && (
                                <LyricLine
                                    lyric={currentLyric.previous}
                                    type="previous"
                                    syncLevel={syncLevel}
                                    currentTime={currentTime}
                                    getHighlightedContent={getHighlightedContent}
                                    showProgress={showLyricProgress}
                                />
                            )}

                            <LyricLine
                                lyric={currentLyric.current}
                                type="current"
                                syncLevel={syncLevel}
                                currentTime={currentTime}
                                getHighlightedContent={getHighlightedContent}
                                nextLyricTime={currentLyric.next?.time}
                                showProgress={showLyricProgress}
                            />

                            {currentLyric.next && (
                                <LyricLine
                                    lyric={currentLyric.next}
                                    type="next"
                                    syncLevel={syncLevel}
                                    currentTime={currentTime}
                                    getHighlightedContent={getHighlightedContent}
                                    showProgress={showLyricProgress}
                                />
                            )}
                        </>
                    )}

                    {currentLyric && upcomingLyrics.map((lyric, index) => (
                        <LyricLine
                            key={currentLyric.index + index + 2}
                            lyric={lyric}
                            type="upcoming"
                            syncLevel={syncLevel}
                            currentTime={currentTime}
                            getHighlightedContent={getHighlightedContent}
                            showProgress={showLyricProgress}
                        />
                    ))}
                </div>
            ) : (
                <div className="betterFullscreen-no-lyrics">
                    <div className="betterFullscreen-no-lyrics-icon">♪</div>
                    <div>No lyrics available</div>
                    {onRetry && errorStatus !== 404 && (
                        <button className="betterFullscreen-retry-button" onClick={onRetry}>
                            Retry
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});
Lyrics.displayName = 'Lyrics';
