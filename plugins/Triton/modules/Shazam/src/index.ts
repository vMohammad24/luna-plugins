import { actions, store } from "@neptune";

import { MediaItem, Signal, Tracer, interceptPromise } from "@triton/lib";

import { recognizeTrack } from "./shazam.native";

import { storage } from "./Settings";
export { Settings } from "./Settings";

export const errSignal = new Signal<string | undefined>(undefined);
const trace = Tracer("[Shazam]", errSignal);

const addToPlaylist = async (playlistUUID: string, mediaItemIdsToAdd: string[]) => {
	await interceptPromise(
		() => actions.content.addMediaItemsToPlaylist({ mediaItemIdsToAdd, onDupes: "SKIP", playlistUUID }),
		["etag/SET_PLAYLIST_ETAG", "content/ADD_MEDIA_ITEMS_TO_PLAYLIST_SUCCESS"],
		["content/ADD_MEDIA_ITEMS_TO_PLAYLIST_FAIL"]
	);
	actions.content.loadListItemsPage({ listName: `playlists/${playlistUUID}`, listType: "mediaItems", reset: false });
	setTimeout(() => actions.content.loadListItemsPage({ listName: `playlists/${playlistUUID}`, listType: "mediaItems", reset: true }), 1000);
};

// Define the function
const handleDrop = async (event: DragEvent) => {
	try {
		event.preventDefault();
		event.stopPropagation();

		// @ts-expect-error TS Api
		const { currentPath, currentParams } = store.getState().router;

		if (!currentPath.startsWith("/playlist/")) {
			return trace.msg.err(`This is not a playlist!`);
		}
		const playlistUUID: string = currentParams.playlistId;
		for (const file of event.dataTransfer?.files ?? []) {
			const bytes = await file.arrayBuffer();
			if (bytes === undefined) continue;
			trace.msg.log(`Matching ${file.name}...`);
			try {
				const matches = await recognizeTrack({
					bytes,
					startInMiddle: storage.startInMiddle,
					exitOnFirstMatch: storage.exitOnFirstMatch,
				});
				if (matches.length === 0) return trace.msg.warn(`No matches for ${file.name}`);
				for (const shazamData of matches) {
					const trackName =
						shazamData.track?.share?.text ?? `${shazamData.track?.title ?? "unknown"} by ${shazamData.track?.artists?.[0] ?? "unknown"}"`;
					const prefix = `[File: ${file.name}, Match: ${trackName}]`;
					const isrc = shazamData.track?.isrc;
					trace.log(shazamData);
					if (isrc === undefined) {
						trace.msg.log(`${prefix} No isrc returned from Shazam cannot add to playlist.`);
						continue;
					}
					const mediaItem = await MediaItem.fromIsrc(isrc);
					if (mediaItem !== undefined) {
						trace.msg.log(`Adding ${prefix}...`);
						return await addToPlaylist(playlistUUID, [mediaItem.id.toString()]);
					}
					trace.msg.err(`${prefix} Not avalible in Tidal.`);
				}
			} catch (err) {
				trace.msg.err.withContext(`[File: ${file.name}] Failed to recognize!`)(<Error>err);
			}
		}
	} catch (err) {
		trace.msg.err.withContext(`Unexpected error!`)(<Error>err);
	}
};

// Register the event listener
document.addEventListener("drop", handleDrop);

// Later, when you need to unregister the event listener
export const onUnload = () => document.removeEventListener("drop", handleDrop);
