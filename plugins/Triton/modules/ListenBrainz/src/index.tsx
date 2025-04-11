import { MediaItem, PlayState, Tracer, type Unload } from "@triton/lib";
const trace = Tracer("[ListenBrainz]");

import { ListenBrainz } from "./ListenBrainz";
import { makeTrackPayload } from "./makeTrackPayload";

export { Settings } from "./Settings";

export const unloads = new Set<Unload>();
unloads.add(
	MediaItem.onMediaTransition(async (mediaItem) => {
		const payload = await makeTrackPayload(mediaItem);
		ListenBrainz.updateNowPlaying(payload).catch(trace.msg.err.withContext(`Failed to update NowPlaying!`));
	})
);
unloads.add(
	PlayState.onScrobble(async (mediaItem) => {
		const payload = await makeTrackPayload(mediaItem);
		ListenBrainz.scrobble(payload).catch(trace.msg.err.withContext(`Failed to scrobble!`));
	})
);
