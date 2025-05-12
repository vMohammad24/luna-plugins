import { trace, unloads } from "./init";

import { MediaItem, PlayState, redux, type TPlayQueueItem } from "@luna/lib";

import "./contextMenu";
import { settings } from "./Settings";

export { errSignal, unloads } from "./init";

const getMaxItem = async (mediaItem?: MediaItem) => {
	const maxItem = await mediaItem?.max();
	if (maxItem === undefined) return;
	if (settings.displayInfoPopups) trace.msg.log(`Found replacement for ${mediaItem!.tidalItem.title}`);
	return maxItem;
};

const playMaxItem = async (elements: readonly TPlayQueueItem[], index: number) => {
	const newElements = [...elements];
	if (newElements[index]?.mediaItemId === undefined) return false;

	const mediaItem = await MediaItem.fromId(newElements[index].mediaItemId);
	const maxItem = await getMaxItem(mediaItem);
	if (maxItem === undefined) return false;

	newElements[index] = { ...newElements[index], mediaItemId: maxItem.id };
	PlayState.updatePlayQueue({
		elements: newElements,
		currentIndex: index,
	});
	return true;
};

export { Settings } from "./Settings";

MediaItem.onPreMediaTransition(unloads, async (mediaItem) => {
	redux.actions["playbackControls/PAUSE"]();
	try {
		const maxItem = await getMaxItem(mediaItem);
		if (maxItem !== undefined) PlayState.playNext(maxItem.id);
	} catch (err) {
		trace.msg.err.withContext("addNext")(err);
	}
	PlayState.play();
});
redux.intercept("playQueue/ADD_NOW", unloads, (payload) => {
	(async () => {
		const mediaItemIds = [...payload.mediaItemIds];
		const currentIndex = payload.fromIndex ?? 0;
		try {
			const mediaItem = await MediaItem.fromId(mediaItemIds[currentIndex]);
			const maxItem = await getMaxItem(mediaItem);
			if (maxItem !== undefined) mediaItemIds[currentIndex] = maxItem.id;
		} catch (err) {
			trace.msg.err.withContext("playQueue/ADD_NOW")(err);
		}
		redux.actions["playQueue/ADD_NOW"]({ ...payload, mediaItemIds });
	})();
	return true;
});

redux.intercept(["playQueue/MOVE_TO", "playQueue/MOVE_NEXT", "playQueue/MOVE_PREVIOUS"], unloads, (payload, action) => {
	(async () => {
		const { elements, currentIndex } = PlayState.playQueue;
		switch (action) {
			case "playQueue/MOVE_NEXT":
				if (!(await playMaxItem(elements, currentIndex + 1))) PlayState.next();
				break;
			case "playQueue/MOVE_PREVIOUS":
				if (!(await playMaxItem(elements, currentIndex - 1))) PlayState.previous();
				break;
			case "playQueue/MOVE_TO":
				if (!(await playMaxItem(elements, payload ?? currentIndex))) PlayState.moveTo(payload ?? currentIndex);
				break;
		}
		PlayState.play();
	})();
	return true;
});
