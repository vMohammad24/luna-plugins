import { Tracer, type LunaUnload } from "@luna/core";
import { MediaItem, PlayState } from "@luna/unstable";

export const { trace, errSignal } = Tracer("[ListenBrainz]");

import { ListenBrainz } from "./ListenBrainz";
import { makeTrackPayload } from "./makeTrackPayload";

export { Settings } from "./Settings";

export const unloads = new Set<LunaUnload>();
unloads.add(
	MediaItem.onMediaTransition(unloads, async (mediaItem) => {
		const payload = await makeTrackPayload(mediaItem);
		ListenBrainz.updateNowPlaying(payload).catch(trace.msg.err.withContext(`Failed to update NowPlaying!`));
	})
);
unloads.add(
	PlayState.onScrobble(unloads, async (mediaItem) => {
		const payload = await makeTrackPayload(mediaItem);
		ListenBrainz.scrobble(payload).catch(trace.msg.err.withContext(`Failed to scrobble!`));
	})
);
