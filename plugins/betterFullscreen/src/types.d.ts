export interface SyncedWord {
    time: number;
    word: string;
    endTime: number;
    characters?: SyncedCharacter[];
}

export interface EnhancedSyncedLyric {
    time: number;
    text: string;
    words: SyncedWord[];
    confidence?: number;
}

export interface SyncedCharacter {
    time: number;
    char: string;
    endTime: number;
}

export interface Color {
    rgb: number[];
    hex: string;
    readable: {
        rgb: number[];
        hex: string;
        visibilityScore: number;
        contrastRatios: {
            highlightVsBackground: number;
            whiteVsHighlight: number;
        };
        blurredBackground: {
            rgb: number[];
            hex: string;
        };
    };
    readableHex: string;
}