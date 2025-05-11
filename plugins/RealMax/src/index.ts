import { trace, unloads } from "./init";

import { MediaItem, redux, type TPlayQueueItem } from "@luna/lib";

import "./contextMenu";

export { errSignal, unloads } from "./init";

// TODO: Abstract PlayQueue in lib
const playMaxItem = async (elements: readonly TPlayQueueItem[], index: number) => {
	const newElements = [...elements];
	const mediaItem = await MediaItem.fromId(newElements[index].mediaItemId);
	const maxItem = await mediaItem?.max();
	if (maxItem !== undefined) {
		await maxItem.ensureLoaded();
		newElements[index] = { ...newElements[index], mediaItemId: maxItem.id };
		redux.actions["playQueue/RESET"]({
			elements: newElements,
			currentIndex: index,
		});
		return true;
	}
	return false;
};

export { Settings } from "./Settings";

MediaItem.onPreMediaTransition(unloads, async (mediaItem) => {
	redux.actions["playbackControls/PAUSE"]();
	try {
		const maxItem = await mediaItem.max();
		if (maxItem !== undefined) {
			await maxItem.ensureLoaded();
			redux.actions["playQueue/ADD_NEXT"]({ mediaItemIds: [maxItem.id], context: { type: "UNKNOWN" } });
			redux.actions["playQueue/MOVE_NEXT"]();
		}
		redux.actions["playbackControls/PLAY"]();
	} catch (err) {
		trace.msg.err.withContext("addNext")(err);
		redux.actions["playbackControls/PLAY"]();
	}
});
redux.intercept("playQueue/ADD_NOW", unloads, async (payload) => {
	const mediaItemIds = [...payload.mediaItemIds];
	const currentIndex = payload.fromIndex ?? 0;
	try {
		const mediaItem = await MediaItem.fromId(mediaItemIds[currentIndex]);
		const maxItem = await mediaItem?.max();
		if (maxItem !== undefined) {
			await maxItem.ensureLoaded();
			mediaItemIds[currentIndex] = maxItem.id;
		}
		redux.actions["playQueue/ADD_NOW"]({ ...payload, mediaItemIds });
	} catch (err) {
		trace.msg.err.withContext("playQueue/ADD_NOW")(err);
		redux.actions["playQueue/ADD_NOW"]({ ...payload, mediaItemIds });
	}
	return true;
});

redux.intercept(["playQueue/MOVE_TO", "playQueue/MOVE_NEXT", "playQueue/MOVE_PREVIOUS"], unloads, (payload, action) => {
	(async () => {
		const { elements, currentIndex } = redux.store.getState().playQueue;
		switch (action) {
			case "playQueue/MOVE_NEXT":
				if (!(await playMaxItem(elements, currentIndex + 1))) redux.actions["playQueue/MOVE_NEXT"]();
				break;
			case "playQueue/MOVE_PREVIOUS":
				if (!(await playMaxItem(elements, currentIndex - 1))) redux.actions["playQueue/MOVE_PREVIOUS"]();
				break;
			case "playQueue/MOVE_TO":
				if (!(await playMaxItem(elements, payload ?? currentIndex))) redux.actions["playQueue/MOVE_TO"](payload ?? currentIndex);
				break;
		}
		redux.actions["playbackControls/PLAY"]();
	})();
	return true;
});
