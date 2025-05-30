import { MediaItem, observe, StyleTag } from "@luna/lib";

import styles from "file://styles.css?minify";
import { unloads } from "./index.safe";
import { setFormatInfo } from "./setFLACInfo";
import { setInfoColumns as setFormatColumns } from "./setInfoColumns";
import { setQualityTags } from "./setQualityTags";
import { settings, Settings } from "./Settings";

export { Settings, unloads };

new StyleTag("TidalTags", unloads, styles);

observe(unloads, 'div[data-test="tracklist-row"]', async (trackRow) => {
	if (!settings.displayQalityTags && !settings.displayFormatColumns) return;
	const trackId = trackRow.getAttribute("data-track-id");
	if (trackId == null) return;

	const mediaItem = await MediaItem.fromId(trackId);
	if (mediaItem === undefined) return;

	if (settings.displayQalityTags) setQualityTags(trackRow, mediaItem);
	if (settings.displayFormatColumns) setFormatColumns(trackRow, mediaItem);
});

MediaItem.onMediaTransition(unloads, setFormatInfo);
MediaItem.fromPlaybackContext().then(setFormatInfo);
