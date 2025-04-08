import { MediaItem } from "./MediaItem";

export type FlacTags = {
	title?: string;
	trackNumber?: string;
	discNumber?: string;
	bpm?: string;
	date?: string;
	copyright?: string;
	REPLAYGAIN_TRACK_GAIN?: string;
	REPLAYGAIN_TRACK_PEAK?: string;
	comment?: string;
	isrc?: string;
	upc?: string;
	musicbrainz_trackid?: string;
	musicbrainz_albumid?: string;
	artist?: string[];
	album?: string;
	albumArtist?: string[];
	genres?: string;
	organization?: string;
	totalTracks?: string;
	lyrics?: string;
	year?: string;
};
export const availableTags: (keyof FlacTags)[] = [
	"title",
	"trackNumber",
	"discNumber",
	"bpm",
	"date",
	"copyright",
	"REPLAYGAIN_TRACK_GAIN",
	"REPLAYGAIN_TRACK_PEAK",
	"comment",
	"isrc",
	"upc",
	"musicbrainz_trackid",
	"musicbrainz_albumid",
	"artist",
	"album",
	"albumArtist",
	"genres",
	"organization",
	"totalTracks",
	"lyrics",
	"year",
];

export type MetaTags = {
	tags: FlacTags;
	coverUrl: string | undefined;
};

export const makeTags = async (mediaItem: MediaItem): Promise<MetaTags> => {
	const tags: FlacTags = {};

	tags.title = await mediaItem.title();

	tags.trackNumber = mediaItem.trackNumber?.toString();
	tags.date = await mediaItem.releaseDateStr();
	tags.REPLAYGAIN_TRACK_PEAK = mediaItem.replayGainPeak?.toString();
	tags.REPLAYGAIN_TRACK_GAIN = mediaItem.replayGain?.toString();
	tags.comment = mediaItem.url;
	tags.copyright = mediaItem.copyright;
	tags.bpm = mediaItem.bpm?.toString();
	tags.discNumber = mediaItem.volumeNumber?.toString();

	tags.artist = await MediaItem.artistNames(mediaItem.artists());
	if (tags.artist.length === 0) tags.artist = ["Unknown Artist"];

	tags.musicbrainz_trackid = await mediaItem.brainzId();

	for (const isrc of await mediaItem.isrcs()) {
		tags.isrc = isrc;
		break;
	}

	const album = await mediaItem.album();
	if (album) {
		tags.upc = await album.upc();
		tags.musicbrainz_albumid = await album.brainzId();
		tags.album = await album.title();

		tags.albumArtist = await MediaItem.artistNames(album.artists());
		if (tags.albumArtist.length === 0) tags.albumArtist = ["Unknown Artist"];

		tags.genres = album.genre;
		tags.organization = album.recordLabel;

		tags.totalTracks = album.totalTracks?.toString();
		tags.year = album.releaseYear;
	}

	const lyrics = await mediaItem.lyrics();
	tags.lyrics = lyrics?.lyrics;

	// Ensure core tags are set
	tags.album ??= "Unknown Album";

	return { tags, coverUrl: await mediaItem.coverUrl() };
};
