import { Tracer, type LunaUnload } from "@luna/core";
import { StyleTag, type ItemId } from "@luna/lib";
import { ContentBase, MediaItem } from "@luna/unstable";

const { trace, errSignal } = Tracer("[CoverTheme]");
export { errSignal, trace };

import transparent from "file://transparent.css?minify";

import { settings, storage } from "./Settings";
import { getPalette, type Palette } from "./vibrant.native";

const cachePalette = async (mediaItem: MediaItem): Promise<Palette | undefined> => {
	// Try use tidalItem.album?.cover first to avoid extra request
	const cover = mediaItem.tidalItem.album?.cover !== undefined ? mediaItem.tidalItem.album.cover : (await mediaItem.album())?.tidalAlbum.cover;
	if (cover === undefined) return;
	const coverUrl = ContentBase.formatCoverUrl(cover, "640");
	if (coverUrl === undefined) return;
	return await storage.ensure<Palette>(`palette.${cover}`, () => getPalette(coverUrl));
};

const vars = new Set<string>();
let currentItem: ItemId;
const updateBackground = async (mediaItem?: MediaItem) => {
	if (mediaItem === undefined || mediaItem.id === currentItem) return;
	currentItem = mediaItem.id;
	const palette = await cachePalette(mediaItem).catch(trace.msg.err.withContext("Failed to update background"));
	if (palette === undefined) return;

	for (const colorName in palette) {
		const variableName = `--cover-${colorName}`;
		vars.add(variableName);
		document.documentElement.style.setProperty(variableName, palette[colorName] ?? null);
	}
};

export { Settings } from "./Settings";

export const unloads = new Set<LunaUnload>();
export const style = new StyleTag("CoverTheme", unloads, settings.applyTheme ? transparent : "");
setTimeout(() => MediaItem.fromPlaybackContext().then(updateBackground));

MediaItem.onMediaTransition(unloads, updateBackground);
MediaItem.onPreload(unloads, cachePalette);
MediaItem.onPreMediaTransition(unloads, updateBackground);
unloads.add(() => vars.forEach((variable) => document.documentElement.style.removeProperty(variable)));
