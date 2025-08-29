import { ftch } from "@luna/core";
import { settings } from "./settings";
import { EnhancedSyncedLyric } from "./types";


export async function getLyrics(trackId: number): Promise<EnhancedSyncedLyric[]> {
    const url = settings.apiURL.replace("%s", trackId.toString())
    const res = await ftch.json<any>(url);
    if (Array.isArray(res?.enhancedLyrics)) {
        return res.enhancedLyrics;
    } else if (Array.isArray(res)) {
        return res.map((lyric: any) => ({
            time: lyric.t,
            text: lyric.l,
            words: lyric.w.map((word: any) => ({
                time: word.t,
                endTime: word.e,
                word: word.w
            })),
        }));
    }
    return [];

}

