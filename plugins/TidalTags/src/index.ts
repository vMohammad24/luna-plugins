import type { LunaUnload } from "@luna/core";
import { MediaItem, observe, StyleTag } from "@luna/lib";

import styles from "file://styles.css?minify";
import { setQualityTags } from "./setQualityTags";

const unloads = new Set<LunaUnload>();

new StyleTag("TidalTags", unloads, styles);

observe(unloads, 'div[data-test="tracklist-row"]', async (elem) => {
	const trackId = elem.getAttribute("data-track-id");
	if (trackId == null) return;

	const mediaItem = await MediaItem.fromId(trackId);
	if (mediaItem === undefined) return;

	setQualityTags(elem, mediaItem);
	// 	if (settings.displayInfoColumns) setInfoColumns(trackRow, trackId, trackItem);
});
