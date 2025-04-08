import { MediaItem, StyleTag, Tracer } from "@triton/lib";

const trace = Tracer("[CoverTheme]");

import type { ItemId } from "neptune-types/tidal";

import transparent from "file://transparent.css?minify";

import { getPalette, type Palette } from "./vibrant.native";

// TODO: replace this with proper triton storage
const storage: any = {};
const settings: any = {
	transparentTheme: true,
};

export { Settings } from "./Test";

storage.paletteCache ??= {};
const vars = new Set<string>();

const cachePalette = async (mediaItem: MediaItem): Promise<Palette | undefined> => {
	const album = await mediaItem.album();
	const coverUrl = album?.coverUrl("640");
	if (coverUrl === undefined) return;
	return ((storage.paletteCache as Record<string, Palette>)[album!.tidalAlbum!.cover!] ??= await getPalette(coverUrl));
};

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

const unloads = [MediaItem.onMediaTransition(updateBackground), MediaItem.onPreload(cachePalette), MediaItem.onPreMediaTransition(updateBackground)];

const style = new StyleTag("CoverTheme", settings.transparentTheme ? transparent : "");
export const updateStyle = () => (style.css = settings.transparentTheme ? transparent : "");
setTimeout(async () => updateBackground(await MediaItem.fromPlaybackContext()));

export const onUnload = () => {
	for (const unload of unloads) unload();
	style.remove();
	vars.forEach((variable) => document.documentElement.style.removeProperty(variable));
};
