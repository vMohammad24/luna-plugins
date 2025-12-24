import React, { memo, useMemo } from 'react';
import { Color, LyricLine as LyricLineType, SongData } from '../types';


const CHARS_PER_COLOR = 7;
const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const getInterpolatedColor = (colors: Color[], globalIndex: number): string => {
    if (!colors?.length) return 'inherit';

    const position = globalIndex / CHARS_PER_COLOR;
    const colorIndex = Math.floor(position) % colors.length;
    const nextColorIndex = (colorIndex + 1) % colors.length;
    const factor = position % 1;

    const [r1, g1, b1] = colors[colorIndex].rgb;
    const [r2, g2, b2] = colors[nextColorIndex].rgb;

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return `rgb(${r}, ${g}, ${b})`;
};



const useActiveLyricState = (lines: LyricLineType[], currentTime: number) => {
    return useMemo(() => {
        if (!lines.length) {
            return { current: null, previous: null, next: null, upcoming: [] };
        }

        let left = 0;
        let right = lines.length - 1;
        let idx = -1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (lines[mid].time <= currentTime) {
                idx = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        const index = idx === -1 ? 0 : idx;

        return {
            current: lines[index],
            previous: lines[index - 1] || null,
            next: lines[index + 1] || null,
            upcoming: lines.slice(index + 2, index + 5),
        };
    }, [lines, currentTime]);
};


interface SyncedCharProps {
    char: string;
    globalIndex: number;
    status: 'active' | 'previous' | 'upcoming';
    colors: Color[];
}

const SyncedChar = memo(({ char, globalIndex, status, colors }: SyncedCharProps) => {
    const isRtlChar = RTL_REGEX.test(char);
    const baseClass = isRtlChar ? 'char char-connected' : 'char';

    const style: React.CSSProperties | undefined = useMemo(() => {
        if (status !== 'active') return undefined;
        const color = getInterpolatedColor(colors, globalIndex);
        return { color, '--char-color': color } as React.CSSProperties;
    }, [status, colors, globalIndex]);

    return (
        <span className={`${baseClass} char-${status}`} style={style}>
            {char}
        </span>
    );
}, (prev, next) => (
    prev.status === next.status &&
    prev.globalIndex === next.globalIndex &&
    prev.colors === next.colors
));
SyncedChar.displayName = 'SyncedChar';

const SyncedWord = memo(({ word, status, hasSpace }: {
    word: string,
    status: 'active' | 'previous' | 'upcoming',
    hasSpace: boolean
}) => {
    const className = status === 'active'
        ? 'word-active'
        : status === 'previous' ? 'word word-previous' : 'word';

    return (
        <span className={className}>
            {word}{hasSpace ? ' ' : ''}
        </span>
    );
});
SyncedWord.displayName = 'SyncedWord';

const LineProgressBar = memo(({
    startTime,
    endTime,
    currentTime
}: { startTime: number, endTime: number, currentTime: number }) => {
    const duration = endTime - startTime;
    if (duration <= 0) return null;

    const percentage = Math.min(Math.max(((currentTime - startTime) / duration) * 100, 0), 100);

    return (
        <div className="betterFullscreen-lyrics-progress">
            <div
                className="betterFullscreen-lyrics-progress-bar"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
});
LineProgressBar.displayName = 'LineProgressBar';


const CharacterSyncView = ({ line, currentTime, colors }: { line: LyricLineType, currentTime: number, colors: Color[] }) => {
    let globalCharIndex = 0;

    return (
        <>
            {line.words?.map((word, wIdx) => {
                const wordHasSpace = wIdx < (line.words?.length ?? 0) - 1;

                const chars = word.characters?.map((char, cIdx) => {
                    const charEnd = char.end_time || word.end_time;
                    let status: SyncedCharProps['status'] = 'upcoming';

                    if (currentTime >= charEnd) status = 'previous';
                    else if (currentTime >= char.time) status = 'active';

                    return (
                        <SyncedChar
                            key={`${wIdx}-${cIdx}`}
                            char={char.char}
                            globalIndex={globalCharIndex++}
                            status={status}
                            colors={colors}
                        />
                    );
                });

                return (
                    <span key={wIdx} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                        {chars}
                        {wordHasSpace && <span>&nbsp;</span>}
                    </span>
                );
            })}
        </>
    );
};

const WordSyncView = ({ line, currentTime }: { line: LyricLineType, currentTime: number }) => {
    return (
        <>
            {line.words?.map((word, i) => {
                let status: 'previous' | 'active' | 'upcoming' = 'upcoming';
                if (currentTime >= word.end_time) status = 'previous';
                else if (currentTime >= word.time) status = 'active';

                return (
                    <SyncedWord
                        key={i}
                        word={word.word}
                        status={status}
                        hasSpace={i < (line.words?.length ?? 0) - 1}
                    />
                );
            })}
        </>
    );
};


const LineContent = ({
    lyric,
    viewType,
    syncLevel,
    currentTime,
    gradientColors
}: {
    lyric: LyricLineType,
    viewType: string,
    syncLevel: string,
    currentTime: number,
    gradientColors: Color[]
}) => {
    if (viewType !== 'current' || !lyric.words) {
        return <>{lyric.text}</>;
    }

    if (syncLevel === 'Character') {
        return <CharacterSyncView line={lyric} currentTime={currentTime} colors={gradientColors} />;
    }

    if (syncLevel === 'Word') {
        return <WordSyncView line={lyric} currentTime={currentTime} />;
    }

    return <>{lyric.text}</>;
};

const LyricLine = ({
    lyric,
    viewType,
    syncLevel,
    currentTime,
    nextLyricTime,
    showProgress,
    gradientColors,
}: {
    lyric: LyricLineType;
    viewType: 'previous' | 'current' | 'next' | 'upcoming';
    syncLevel: string;
    currentTime: number;
    nextLyricTime?: number;
    showProgress?: boolean;
    gradientColors: Color[];
}) => {
    const isRtl = RTL_REGEX.test(lyric.text);

    return (
        <div
            className={`betterFullscreen-lyric ${viewType}`}
            style={{ direction: isRtl ? 'rtl' : 'ltr' }}
        >
            <LineContent
                lyric={lyric}
                viewType={viewType}
                syncLevel={syncLevel}
                currentTime={currentTime}
                gradientColors={gradientColors}
            />

            {showProgress && viewType === 'current' && nextLyricTime && (
                <LineProgressBar
                    startTime={lyric.time}
                    endTime={nextLyricTime}
                    currentTime={currentTime}
                />
            )}
        </div>
    );
};


interface LyricsProps {
    songData: SongData | undefined;
    currentTime: number;
    syncLevel: string;
    loading: boolean;
    showLyricProgress: boolean;
    gradientColors: Color[];
    onRetry?: () => void;
    errorStatus?: number | null;
}

export const Lyrics = ({
    songData,
    currentTime,
    syncLevel,
    loading,
    showLyricProgress,
    gradientColors,
    onRetry,
    errorStatus,
}: LyricsProps) => {
    const lines = songData?.lines || [];
    const { current, previous, next, upcoming } = useActiveLyricState(lines, currentTime);

    if (loading) {
        return <div className="betterFullscreen-loading">Loading lyrics...</div>;
    }

    if (!lines.length) {
        return (
            <div className="betterFullscreen-no-lyrics">
                <div className="betterFullscreen-no-lyrics-icon">♪</div>
                <div>No lyrics available</div>
                {onRetry && errorStatus !== 404 && (
                    <button className="betterFullscreen-retry-button" onClick={onRetry}>
                        Retry
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="betterFullscreen-lyrics-container">
            <div className="betterFullscreen-lyrics">
                {previous && (
                    <LyricLine
                        key={previous.time}
                        lyric={previous}
                        viewType="previous"
                        syncLevel={syncLevel}
                        currentTime={currentTime}
                        gradientColors={gradientColors}
                    />
                )}

                {current && (
                    <LyricLine
                        key={current.time}
                        lyric={current}
                        viewType="current"
                        syncLevel={syncLevel}
                        currentTime={currentTime}
                        nextLyricTime={next?.time}
                        showProgress={showLyricProgress}
                        gradientColors={gradientColors}
                    />
                )}

                {next && (
                    <LyricLine
                        key={next.time}
                        lyric={next}
                        viewType="next"
                        syncLevel={syncLevel}
                        currentTime={currentTime}
                        gradientColors={gradientColors}
                    />
                )}

                {upcoming.map((line) => (
                    <LyricLine
                        key={line.time}
                        lyric={line}
                        viewType="upcoming"
                        syncLevel={syncLevel}
                        currentTime={0}
                        gradientColors={gradientColors}
                    />
                ))}
            </div>
        </div>
    );
};

Lyrics.displayName = 'Lyrics';