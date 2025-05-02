import type { MediaItem } from "@luna/unstable";

import { type Payload, MusicServiceDomain } from "./ListenBrainzTypes";

const delUndefined = <O extends Record<any, any>>(obj: O) => {
	for (const key in obj) if (obj[key] === undefined) delete obj[key];
};

export const makeTrackPayload = async (mediaItem: MediaItem): Promise<Payload> => {
	const album = await mediaItem.album();

	const trackPayload: Payload = {
		listened_at: Math.floor(Date.now() / 1000),
		track_metadata: {
			artist_name: (await mediaItem.artist())?.name!,
			track_name: (await mediaItem.title())!,
			release_name: await album?.title(),
		},
	};

	trackPayload.track_metadata.additional_info = {
		recording_mbid: await mediaItem.brainzId(),
		isrc: await mediaItem.isrc(),
		tracknumber: mediaItem.trackNumber,
		music_service: MusicServiceDomain.TIDAL,
		origin_url: mediaItem.url,
		duration: mediaItem.duration,
		media_player: "Tidal Desktop",
		submission_client: "Neptune Scrobbler",
	};
	delUndefined(trackPayload.track_metadata.additional_info);
	return trackPayload;
};
