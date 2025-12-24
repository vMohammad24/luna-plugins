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


export interface SongData {
    lines: LyricLine[];
    track_info: TrackInfo;
    genres: string[];
    audio_features: AudioFeatures;
    audio_analysis: AudioAnalysis;
    vocal_analysis: VocalAnalysis;
    emotion_analysis: EmotionAnalysis;
    timings: ProcessingTimings;
}


export interface LyricLine {
    time: number;
    text: string;
    words: WordTiming[];
    section: "intro" | "verse" | "chorus" | "bridge" | "outro";
    metadata: LineMetadata;
}

export interface WordTiming {
    time: number;
    end_time: number;
    characters: CharacterTiming[];
    word: string;
    is_parenthetical: boolean;
    confidence: number;
    syllable_count: number;
    phonetic_complexity: number;
    p_center_offset: number;
}

export interface CharacterTiming {
    time: number;
    end_time: number;
    char: string;
    is_vowel: boolean;
    is_silent: boolean;
    phoneme: string;
}

export interface LineMetadata {
    vocal_activity_score: number;
    quality_score: number;
    audio_characteristics: {
        tempo_aligned: boolean;
        beat_strength: number;
    };
    section_confidence: number;
}


export interface TrackInfo {
    track: string;
    artist: string;
    album: string;
    spotify_id: string;
}

export interface AudioFeatures {
    danceability: number;
    energy: number;
    key: number;
    loudness: number;
    mode: number;
    speechiness: number;
    acousticness: number;
    instrumentalness: number;
    liveness: number;
    valence: number;
    tempo: number;
    duration_ms: number;
    time_signature: number;
}


export interface AudioAnalysis {
    segments: AudioSegment[];
    beats: TimeInterval[];
    bars: TimeInterval[];
    tatums: TimeInterval[];
    sections: AudioSection[];
}

export interface AudioSegment {
    start: number;
    duration: number;
    confidence: number;
    loudness_start: number;
    loudness_max: number;
    loudness_max_time: number;
    loudness_end: number;
    pitches: number[];
    timbre: number[];
}

export interface AudioSection extends AudioFeatures {
    start: number;
    duration: number;
    confidence: number;
    tempo_confidence: number;
    key_confidence: number;
    mode_confidence: number;
    time_signature_confidence: number;
}

export interface TimeInterval {
    start: number;
    duration: number;
    confidence: number;
}


export interface VocalAnalysis {
    vocal_summary: {
        primary_vocal_type: string;
        backing_vocal_percentage: number;
        adlib_percentage: number;
        vocal_complexity: number;
        techniques: string[];
    };
    line_classifications: {
        line_index: number;
        vocal_type: "Lead" | "Rap" | "BackingVocal";
        confidence: number;
        is_layered: boolean;
        techniques: string[];
    }[];
}

export interface EmotionAnalysis {
    primary_emotion: string;
    secondary_emotion: string;
    confidence: number;
    intensity: number;
    line_emotions: {
        line_index: number;
        emotion: string;
        intensity: number;
        keywords: string[];
    }[];
    emotional_arc: {
        progression: string;
        stability: number;
        shifts: string[];
    };
    themes: string[];
}

export interface ProcessingTimings {
    track_resolution_ms: number;
    lyrics_fetch_ms: number;
    spotify_id_resolution_ms: number;
    metadata_fetch_ms: number;
    lyrics_processing_ms: number;
    vocal_analysis_ms: number;
    emotion_detection_ms: number;
    total_ms: number;
}