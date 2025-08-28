import { ftch } from "@luna/core";
import { settings } from "./settings";
import { EnhancedSyncedLyric } from "./types";


export async function getLyrics(trackId: number): Promise<EnhancedSyncedLyric[]> {
    const res = await ftch.json<any>(settings.apiURL.replace("%s", trackId.toString()));
    return res?.enhancedLyrics ?? typeof res === "object" ? res?.map((lyric: any) => ({
        time: lyric.t,
        text: lyric.l,
        words: lyric.w.map((word: any) => ({
            time: word.t,
            endTime: word.e,
            word: word.w
        })),
    })) : [];
}