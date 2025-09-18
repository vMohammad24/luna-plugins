import { ftch } from "@luna/core";
import { settings } from "./settings";
import { EnhancedSyncedLyric } from "./types";


export async function getLyrics(trackId: number, retries = 3): Promise<EnhancedSyncedLyric[]> {
    const url = settings.apiURL.replace("%s", trackId.toString());
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
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
        } catch (err) {
            if (attempt === retries - 1) throw err;
        }
    }
    return [];
}


export function getDominantColor(fileUrl: string): Promise<string> {
    return ftch.json<{ readableHex: string }[]>("https://api.vmohammad.dev/dominant?fileUrl=" + encodeURIComponent(fileUrl)).then(res => res[0].readableHex)
}