import { Tracer, type LunaUnload } from "@luna/core";
import { ContentBase, MediaItem, StyleTag, type ItemId } from "@luna/lib";

const { trace, errSignal } = Tracer("[CoverTheme]");
export { errSignal, trace };

import transparent from "file://transparent.css?minify";

import { settings, storage } from "./Settings";
import { getPalette, type Palette, type RGBSwatch } from "./vibrant.native";

const cachePalette = async (mediaItem: MediaItem): Promise<Palette | undefined> => {
	// Try use tidalItem.album?.cover first to avoid extra request
	const cover = mediaItem.tidalItem.album?.cover !== undefined ? mediaItem.tidalItem.album.cover : (await mediaItem.album())?.tidalAlbum.cover;
	if (cover === undefined) return;
	const coverUrl = ContentBase.formatCoverUrl(cover, "640");
	if (coverUrl === undefined) return;
	return await storage.ensure<Palette>(`palette_v2.${cover}`, () => getPalette(coverUrl));
};

const docStyle = document.documentElement.style;
const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
const animateCssVar = (varName: string, from: RGBSwatch | undefined, to: RGBSwatch, duration = 250) => {
	if (from === undefined || from.every((v, i) => v === to[i])) return docStyle.setProperty(varName, to.join(","));
	const start = performance.now();
	const frame = (now: number) => {
		const t = Math.min(1, (now - start) / duration);
		const current = from.map((v, i) => lerp(v, to[i], t));
		docStyle.setProperty(varName, current.join(","));
		if (t < 1) requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);
};

const vars = new Set<string>();
let currentItem: ItemId;
let currentPalette: Palette;
const updateBackground = async (mediaItem?: MediaItem) => {
	if (mediaItem === undefined || mediaItem.id === currentItem) return;
	currentItem = mediaItem.id;
	const palette = await cachePalette(mediaItem).catch(trace.msg.err.withContext("Failed to update background"));
	if (palette === undefined) return;

	for (const colorName in palette) {
		const nextColor = palette[colorName];
		const variableName = `--cover-${colorName}`;
		vars.add(variableName);
		animateCssVar(variableName, currentPalette?.[colorName], nextColor, 250);
	}
	currentPalette = palette;
};

export { Settings } from "./Settings";

export const unloads = new Set<LunaUnload>();
export const style = new StyleTag("CoverTheme", unloads, settings.applyTheme ? transparent : "");
setTimeout(() => MediaItem.fromPlaybackContext().then(updateBackground));

MediaItem.onMediaTransition(unloads, updateBackground);
MediaItem.onPreload(unloads, cachePalette);
MediaItem.onPreMediaTransition(unloads, updateBackground);
unloads.add(() => vars.forEach((variable) => document.documentElement.style.removeProperty(variable)));
