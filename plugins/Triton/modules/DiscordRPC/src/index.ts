import { MediaItem, safeIntercept, type Unload } from "@triton/lib";

import { cleanupRPC } from "./discord.native";
import { updateActivity } from "./updateActivity";

export const unloads = new Set<Unload>();

safeIntercept(["playbackControls/TIME_UPDATE", "playbackControls/SEEK", "playbackControls/SET_PLAYBACK_STATE"], () => setTimeout(updateActivity), unloads);
unloads.add(MediaItem.onMediaTransition(updateActivity));
unloads.add(cleanupRPC.bind(cleanupRPC));

setTimeout(updateActivity);
