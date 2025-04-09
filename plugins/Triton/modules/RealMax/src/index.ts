import { MediaItem, Tracer, type Unload } from "@triton/lib";
export const trace = Tracer("[RealMAX]");

import { actions, store } from "@neptune";
import type { PlayQueueItem } from "neptune-types/tidal";

import { safeIntercept } from "../../../lib/src/intercept/safeIntercept";

const playMaxItem = async (elements: readonly PlayQueueItem[], index: number) => {
	const newElements = [...elements];
	const mediaItem = await MediaItem.fromId(newElements[index].mediaItemId);
	const maxItem = await mediaItem?.max();
	if (maxItem !== undefined) {
		newElements[index].mediaItemId = maxItem.id;
		actions.playQueue.reset({
			elements: newElements,
			currentIndex: index,
		});
		return true;
	}
	return false;
};

export const unloads = new Set<Unload>();
unloads.add(
	MediaItem.onPreMediaTransition(async (mediaItem) => {
		actions.playbackControls.pause();
		try {
			const maxItem = await mediaItem.max();
			if (maxItem !== undefined) {
				actions.playQueue.addNext({ mediaItemIds: [maxItem.id], context: { type: "UNKNOWN" } });
				actions.playQueue.moveNext();
			}
			actions.playbackControls.play();
		} catch (err) {
			trace.msg.err.withContext("addNext")(err);
			actions.playbackControls.play();
		}
	})
);
safeIntercept(
	"playQueue/ADD_NOW",
	(payload) => {
		const mediaItemIds = [...payload.mediaItemIds];
		const currentIndex = payload.fromIndex ?? 0;
		MediaItem.fromId(mediaItemIds[currentIndex])
			.then(async (mediaItem) => {
				const maxItem = await mediaItem?.max();
				if (maxItem !== undefined) mediaItemIds[currentIndex] = maxItem.id;
				actions.playQueue.addNow({ ...payload, mediaItemIds });
			})
			.catch((err) => {
				trace.msg.err.withContext("playQueue/ADD_NOW")(err);
				actions.playQueue.addNow({ ...payload, mediaItemIds });
			});
		return true;
	},
	unloads
);
safeIntercept(
	["playQueue/MOVE_TO", "playQueue/MOVE_NEXT", "playQueue/MOVE_PREVIOUS"],
	(payload, action) => {
		(async () => {
			const { elements, currentIndex } = store.getState().playQueue;
			switch (action) {
				case "playQueue/MOVE_NEXT":
					if (!(await playMaxItem(elements, currentIndex + 1))) actions.playQueue.moveNext();
					break;
				case "playQueue/MOVE_PREVIOUS":
					if (!(await playMaxItem(elements, currentIndex - 1))) actions.playQueue.movePrevious();
					break;
				case "playQueue/MOVE_TO":
					if (!(await playMaxItem(elements, payload ?? currentIndex))) actions.playQueue.moveTo(payload ?? currentIndex);
					break;
			}
			actions.playbackControls.play();
		})();
		return true;
	},
	unloads
);
