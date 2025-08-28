export interface SyncedWord {
    time: number;
    word: string;
    endTime: number;
}

export interface EnhancedSyncedLyric {
    time: number;
    text: string;
    words: SyncedWord[];
    confidence?: number;
}