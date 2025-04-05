import { Tracer } from "@inrixia/lib/helpers/trace";
const trace = Tracer("[ListenBrainz]");

import { ListenBrainz } from "./ListenBrainz";

export { Settings } from "./Settings";

import { MediaItem, PlayState } from "@inrixia/lib";
import { MusicServiceDomain, type Payload } from "./ListenBrainzTypes";

const makeTrackPayload = async (mediaItem: MediaItem): Promise<Payload> => {
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
	removeUndefinedValues(trackPayload.track_metadata.additional_info);
	return trackPayload;
};

const removeUndefinedValues = (obj: Record<any, any>) => {
	for (const key in obj) if (obj[key] === undefined) delete obj[key];
};

const unloads = [
	MediaItem.onMediaTransition((mediaItem) => {
		makeTrackPayload(mediaItem).then(ListenBrainz.updateNowPlaying).catch(trace.msg.err.withContext(`Failed to update NowPlaying!`));
	}),
	PlayState.onScrobble((mediaItem) => {
		makeTrackPayload(mediaItem).then(ListenBrainz.scrobble).catch(trace.msg.err.withContext(`Failed to scrobble!`));
	}),
];
export const onUnload = () => {
	for (const unload of unloads) unload();
};
