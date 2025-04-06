import { MediaItem, Tracer } from "@inrixia/lib";
const trace = Tracer("[NoBuffer]");

import { asyncDebounce } from "@inrixia/helpers";
import { intercept } from "@neptune";

import { Quality } from "../../../lib/classes/Quality";
import { voidTrack } from "./voidTrack.native";

const onStalled = asyncDebounce(async () => {
	const mediaItem = await MediaItem.fromPlaybackContext();
	if (mediaItem === undefined) return;
	trace.msg.log(`Playback stalled... Kicking tidal CDN!`);
	await voidTrack(await mediaItem?.playbackInfo(Quality.Max.audioQuality)).catch(trace.err.withContext("voidTrack"));
});
export const onUnload = intercept("playbackControls/SET_PLAYBACK_STATE", ([state]) => {
	if (state === "STALLED") onStalled();
});
