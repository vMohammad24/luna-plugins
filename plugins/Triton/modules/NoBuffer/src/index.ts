import { MediaItem, Quality, safeIntercept, Signal, Tracer, type Unload } from "@triton/lib";

export const errSignal = new Signal<string | undefined>(undefined);
const trace = Tracer("[NoBuffer]", errSignal);

import { asyncDebounce } from "@inrixia/helpers";

import type { ItemId } from "neptune-types/tidal";
import { voidTrack } from "./voidTrack.native";

const kickCache = new Set<ItemId>();
const onStalled = asyncDebounce(async () => {
	const mediaItem = await MediaItem.fromPlaybackContext();
	if (mediaItem === undefined || kickCache.has(mediaItem.id)) return;
	kickCache.add(mediaItem.id);
	trace.msg.log(`Playback stalled... Kicking tidal CDN!`);
	await voidTrack(await mediaItem?.playbackInfo(Quality.Max.audioQuality)).catch(trace.err.withContext("voidTrack"));
});

export const unloads = new Set<Unload>();
safeIntercept(
	"playbackControls/SET_PLAYBACK_STATE",
	([state]) => {
		if (state === "STALLED") onStalled();
	},
	unloads
);
