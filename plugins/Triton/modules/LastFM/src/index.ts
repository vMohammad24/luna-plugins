import { MediaItem, PlayState, Signal, Tracer, delUndefined, type Unload } from "@triton/lib";

export const errSignal = new Signal<string | undefined>(undefined);
export const trace = Tracer("[last.fm]", errSignal);

import { actions } from "@neptune";
import { LastFM, ScrobbleOpts } from "./LastFM";

actions.lastFm.disconnect();

const makeScrobbleOpts = async (mediaItem: MediaItem): Promise<ScrobbleOpts> => {
	const album = await mediaItem.album();
	const scrobbleOpts: Partial<ScrobbleOpts> = {
		track: await mediaItem.title(),
		artist: (await mediaItem.artist())?.name,
		album: await album?.title(),
		albumArtist: (await album?.artist())?.name,
		trackNumber: mediaItem.trackNumber?.toString(),
		mbid: await mediaItem.brainzId(),
		timestamp: (Date.now() / 1000).toFixed(0),
	};
	delUndefined(scrobbleOpts);
	return scrobbleOpts as ScrobbleOpts;
};

export { Settings } from "./Settings";

export const unloads = new Set<Unload>();
unloads.add(
	MediaItem.onMediaTransition((mediaItem) => {
		makeScrobbleOpts(mediaItem).then(LastFM.updateNowPlaying).catch(trace.msg.err.withContext(`Failed to updateNowPlaying!`));
	})
);
unloads.add(
	PlayState.onScrobble(async (mediaItem) => {
		const scrobbleOpts = await makeScrobbleOpts(mediaItem);
		LastFM.scrobble(scrobbleOpts)
			.catch(trace.msg.err.withContext(`Failed to scrobble!`))
			.then((res) => {
				if (res?.scrobbles) trace.log("Scrobbled", scrobbleOpts, res?.scrobbles["@attr"], res.scrobbles.scrobble);
			});
	})
);
