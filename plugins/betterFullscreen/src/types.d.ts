export interface SyncedCharacter {
    time: number;
    char: string;
    endTime: number;
    isVowel: boolean;
    isSilent: boolean;
    confidence?: number;
    phoneme?: string;
}

export interface SyncedWord {
    time: number;
    word: string;
    endTime: number;
    isParenthetical: boolean;
    confidence?: number;
    syllableCount?: number;
    characters?: SyncedCharacter[];
}

export interface EnhancedSyncedLyric {
    time: number;
    text: string;
    words: SyncedWord[];
    confidence?: number;
}