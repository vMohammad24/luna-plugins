import type { IArtistCredit } from "musicbrainz-api";
import { Album as TAlbum, MediaItem as TMediaItem } from "neptune-types/tidal";

const includesLower = (string: string, includes: string) => string.toLowerCase().includes(includes.toLowerCase());

export const formatTitle = (tidalTitle?: string, tidalVersion?: string, brainzTitle?: string, brainzCredit?: IArtistCredit[]) => {
	brainzTitle = brainzTitle?.replaceAll("’", "'");

	let title = brainzTitle ?? tidalTitle;
	if (title === undefined) return undefined;

	// If the title has feat and its validated by musicBrainz then use the tidal title.
	if (tidalTitle?.includes("feat. ") && !brainzTitle?.includes("feat. ")) {
		const mbHasFeat = brainzCredit && brainzCredit.findIndex((credit) => credit.joinphrase === " feat. ") !== -1;
		if (mbHasFeat) title = tidalTitle;
	}

	// Dont use musicBrainz disambiguation as its not the same as the tidal version!
	if (tidalVersion && !includesLower(title, tidalVersion)) title += ` (${tidalVersion})`;

	return title;
};

type Artists = (string | undefined)[] | TAlbum["artists"] | [TAlbum["artist"]] | TMediaItem["item"]["artists"] | [TMediaItem["item"]["artist"]];
export const formatArtists = (artists: Artists): string[] => {
	if (artists === undefined) return [];
	return artists.reduce((artistTitles, artist) => {
		if (artist !== undefined) {
			if (typeof artist === "string") artistTitles.push(artist);
			else if (artist?.name !== undefined) artistTitles.push(artist.name);
		}
		return artistTitles;
	}, [] as string[]);
};

export type TImageSize = "1280" | "640" | "320" | "160" | "80";
export const formatCoverUrl = (uuid: string, res: TImageSize = "1280") => `https://resources.tidal.com/images/${uuid.split("-").join("/")}/${res}x${res}.jpg`;
