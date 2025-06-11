import { LunaUnload, Tracer } from "@luna/core";
import { redux, TidalApi } from "@luna/lib";

const { trace } = Tracer("[lrclib]");
const unloads = new Set<LunaUnload>();

interface LyricsData {
    id?: number;
    name?: string;
    trackName?: string;
    artistName?: string;
    albumName?: string;
    duration?: number;
    plainLyrics?: string;
    syncedLyrics?: string;
    instrumental?: boolean;
}
// cached it then removed cuz tidal already caches it and lrclib has no ratelimiting 
redux.intercept("content/LOAD_ITEM_LYRICS_FAIL", unloads, async (payload) => {
    const track = await TidalApi.track(payload.itemId);
    if (!track) return;
    const res = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(track.title)}&artist_name=${encodeURIComponent(track.artist?.name || '')}&album_name=${encodeURIComponent(track.album?.title || '')}&duration=${track.duration}`);
    if (!res.ok) {
        trace.err(`Failed to fetch lyrics for track: ${track.title}`);
        return;
    }
    const lyricsData: LyricsData = await res.json();
    await redux.actions["content/LOAD_ITEM_LYRICS_SUCCESS"]({
        isRightToLeft: false,
        lyrics: lyricsData.plainLyrics || "",
        lyricsProvider: "lrclib",
        trackId: payload.itemId,
        subtitles: lyricsData.syncedLyrics || '',
        providerLyricsId: lyricsData.id || 0,
        providerCommontrackId: lyricsData.id || 0,
    });
    trace.log(`Loaded lyrics for track: ${track.title} (${payload.itemId})`);
});