import { Tracer } from "@inrixia/lib/helpers/trace";
const trace = Tracer("[DiscordRPC]");

import { MediaItem, PlayState } from "@inrixia/lib";
import { intercept } from "@neptune";
import type { SetActivity } from "@xhayper/discord-rpc";
import { cleanupRPC, setActivity } from "./discord.native";

const STR_MAX_LEN = 127;
const fmtStr = (s?: string) => {
	if (!s) return;
	if (s.length < 2) s += " ";
	return s.length >= STR_MAX_LEN ? s.slice(0, STR_MAX_LEN - 3) + "..." : s;
};

export const updateActivity = async (mediaItem?: MediaItem) => {
	mediaItem ??= await MediaItem.fromPlaybackContext();
	if (mediaItem === undefined) return;

	const activity: SetActivity = { type: 2 }; // Listening type

	activity.buttons = [
		{
			url: `https://tidal.com/browse/${mediaItem.tidalItem.contentType}/${mediaItem.id}?u`,
			label: "Play Song",
		},
	];

	// Title
	activity.details = await mediaItem.title().then(fmtStr);
	// Artists
	const artistNames = await MediaItem.artistNames(await mediaItem.artists());
	activity.state = fmtStr(artistNames.join(", ")) ?? "Unknown Artist";

	// Pause indicator
	if (PlayState.paused) {
		activity.smallImageKey = "paused-icon";
		activity.smallImageText = "Paused";
		activity.endTimestamp = Date.now();
	} else {
		// Small Artist image
		const artist = await mediaItem.artist();
		activity.smallImageKey = artist?.coverUrl("320");
		console.log(activity.smallImageKey);
		activity.smallImageText = fmtStr(artist?.name);

		// Playback/Time
		if (mediaItem.duration !== undefined) {
			activity.startTimestamp = Date.now() - PlayState.latestCurrentTime * 1000;
			activity.endTimestamp = activity.startTimestamp + mediaItem.duration * 1000;
		}
	}

	// Album
	const album = await mediaItem.album();
	if (album) {
		activity.largeImageKey = album.coverUrl();
		activity.largeImageText = await album.title().then(fmtStr);
	}

	return setActivity(activity).catch(trace.err.withContext("Failed to set activity"));
};

const unloadIntercept = intercept(["playbackControls/TIME_UPDATE", "playbackControls/SEEK", "playbackControls/SET_PLAYBACK_STATE"], () => {
	setTimeout(updateActivity);
});
const unloadTransition = MediaItem.onMediaTransition(updateActivity);

setTimeout(updateActivity);

export const onUnload = () => {
	unloadIntercept();
	unloadTransition();
	cleanupRPC().catch(trace.msg.err.withContext("Failed to cleanup RPC"));
};
