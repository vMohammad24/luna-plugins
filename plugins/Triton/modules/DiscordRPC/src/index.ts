import { MediaItem, safeIntercept, Signal, Tracer, type Unload } from "@triton/lib";

import { cleanupRPC } from "./discord.native";
import { updateActivity } from "./updateActivity";

export const unloads = new Set<Unload>();
export const errSignal = new Signal<string | undefined>(undefined);
export const trace = Tracer("[DiscordRPC]", errSignal);

safeIntercept(
	["playbackControls/TIME_UPDATE", "playbackControls/SEEK", "playbackControls/SET_PLAYBACK_STATE"],
	() => {
		updateActivity()
			.then(() => (errSignal._ = undefined))
			.catch(trace.err.withContext("Failed to set activity"));
	},
	unloads
);
unloads.add(MediaItem.onMediaTransition(updateActivity));
unloads.add(cleanupRPC.bind(cleanupRPC));

setTimeout(updateActivity);
