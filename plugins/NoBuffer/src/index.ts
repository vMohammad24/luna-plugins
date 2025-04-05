import { intercept } from "@neptune";

import { asyncDebounce } from "@inrixia/helpers";
import { Tracer } from "@inrixia/lib/helpers/trace";
import { voidTrack } from "./voidTrack.native";

import { MediaItem } from "@inrixia/lib";
const trace = Tracer("[NoBuffer]");

const onStalled = asyncDebounce(async () => {
	const mediaItem = await MediaItem.fromPlaybackContext();
	if (mediaItem === undefined) return;
	trace.msg.log(`Playback stalled... Kicking tidal CDN!`);
	await voidTrack(await mediaItem?.playbackInfo()).catch(trace.err.withContext("voidTrack"));
});
export const onUnload = intercept("playbackControls/SET_PLAYBACK_STATE", ([state]) => {
	if (state === "STALLED") onStalled();
});
