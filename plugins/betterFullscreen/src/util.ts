import { ftch } from "@luna/core";
import { settings } from "./settings";
import { EnhancedSyncedLyric } from "./types";


export async function getLyrics(trackId: number): Promise<EnhancedSyncedLyric[]> {
    const res = await ftch.json<any>(settings.apiURL.replace("%s", trackId.toString()));
    return res?.enhancedLyrics ?? [];
}