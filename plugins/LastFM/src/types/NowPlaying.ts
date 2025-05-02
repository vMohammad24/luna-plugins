export interface NowPlaying {
	nowplaying?: Nowplaying;
}

interface Nowplaying {
	artist?: Album;
	track?: Album;
	ignoredMessage?: IgnoredMessage;
	albumArtist?: Album;
	album?: Album;
}

interface Album {
	corrected?: string;
	"#text"?: string;
}

interface IgnoredMessage {
	code?: string;
	"#text"?: string;
}
