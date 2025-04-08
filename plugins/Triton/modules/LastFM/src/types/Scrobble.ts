export interface Scrobble {
	scrobbles?: Scrobbles;
}

interface Scrobbles {
	scrobble?: ScrobbleClass;
	"@attr"?: Attr;
}

export interface Attr {
	ignored?: number;
	accepted?: number;
}

interface ScrobbleClass {
	artist?: Album;
	album?: Album;
	track?: Album;
	ignoredMessage?: IgnoredMessage;
	albumArtist?: Album;
	timestamp?: string;
}

interface Album {
	corrected?: string;
	"#text"?: string;
}

interface IgnoredMessage {
	code?: string;
	"#text"?: string;
}
