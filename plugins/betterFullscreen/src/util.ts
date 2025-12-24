import { memoize } from "@inrixia/helpers";
import { ftch } from "@luna/core";
import { settings } from "./settings";
import { Color, SongData } from "./types";

export const getLyrics = memoize(async (trackId: string, retries = 3): Promise<SongData | undefined> => {
    const url = settings.apiURL.replace("%s", trackId);
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return ftch.json<SongData>(url);
        } catch (err) {
            if (attempt === retries - 1) throw err;
        }
    }
})



export function getColors(fileUrl: string): Promise<Color[]> {
    return ftch.json<Color[]>("https://api.vmohammad.dev/dominant?fileUrl=" + encodeURIComponent(fileUrl));
}
export function getDominantColor(fileUrl: string): Promise<string> {
    return getColors(fileUrl).then(res => res[0].readableHex)
}