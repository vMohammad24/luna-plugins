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
redux.intercept("content/LOAD_ITEM_LYRICS_FAIL", unloads, async (payload) => {
    const track = await MediaItem.fromId(payload.itemId, 'track');
    if (!track) return;
    const [title, artist, album] = await Promise.all([
        track.title(),
        track.artist(),
        track.album()
    ]);
    const albumName = album ? await album.title() || '' : '';
    const albumNameVariations = (albumName.includes('(') ? [albumName, albumName.split('(')[0].trim()] : [albumName]);
    const artistName = artist?.name;
    const artistNameVariations = artistName?.includes(',') ? [artistName, artistName.split(',')[0].trim()] : [artistName];
    const titleVariations = title?.includes('(') ? [title, title.split('(')[0].trim()] : [title];

    const variations = [
        ...albumNameVariations.map(album => ({ title, artist: artistName, album })),
        ...artistNameVariations.map(artist => ({ title, artist, album: albumName })),
        ...titleVariations.map(title => ({ title, artist: artistName, album: albumName })),
        ...titleVariations.map(title => ({ title, artist: artistName, album: undefined })),
        ...artistNameVariations.map(artist => ({ title, artist: undefined, album: albumName })),
        ...albumNameVariations.map(album => ({ title, artist: artistName, album: albumName })),
        ...titleVariations.map(title => ({ title, artist: artistName, album: '' })),
        ...artistNameVariations.map(artist => ({ title, artist: artistName, album: '' })),
        ...albumNameVariations.map(album => ({ title, artist: artistName, album: '' }))
    ].filter(variation => variation.title && variation.title.trim());

    const uniqueVariations = Array.from(new Set(variations.map(v => JSON.stringify(v)))).map(v => JSON.parse(v));

    const fetchLyrics = (params: { title?: string; artist?: string; album?: string }) => {
        const urlParams = new URLSearchParams({
            track_name: params.title || '',
            artist_name: params.artist || ''
        });
        if (params.album) urlParams.append('album_name', params.album);

        return ftch.json<LyricsData>(`https://lrclib.net/api/get?${urlParams}`);
    };

    try {
        for (const params of uniqueVariations) {
            try {
                const lyricsData = await fetchLyrics(params);
                if (lyricsData) {
                    await redux.actions["content/LOAD_ITEM_LYRICS_SUCCESS"]({
                        isRightToLeft: false,
                        lyrics: lyricsData.plainLyrics || "",
                        lyricsProvider: "lrclib",
                        trackId: payload.itemId,
                        subtitles: lyricsData.syncedLyrics || '',
                        providerLyricsId: lyricsData.id || 0,
                        providerCommontrackId: lyricsData.id || 0,
                    });
                    trace.log(`Loaded lyrics for track: ${title} (${payload.itemId})`);
                    return;
                }
            } catch { }
        }
    } catch (e) {
        trace.msg.err("Failed to fetch lyrics:", e);
        return;
    }
});