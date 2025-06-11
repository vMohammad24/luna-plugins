import { ftch, LunaUnload, Tracer } from "@luna/core";
import { MediaItem, redux } from "@luna/lib";

export const { trace } = Tracer("[lrclib]");
export const unloads = new Set<LunaUnload>();

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
    const track = await MediaItem.fromId(payload.itemId, 'track');
    if (!track) return;
    const [title, artist, album] = await Promise.all([
        track.title(),
        track.artist(),
        track.album()
    ])
    const albumName = album ? await album.title() || '' : '';
    try {
        const lyricsData: LyricsData = await ftch.json(`https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist?.name || '')}&album_name=${encodeURIComponent(albumName)}&duration=${track.duration}`);
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
    } catch (e) {
        trace.err(`Failed to fetch lyrics for track: ${track.title}, error: ${e}`);
        return;
    }

});