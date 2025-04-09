import { getStorage, MediaItem, React, StyleTag, Tracer, TritonSwitch, type Unload } from "@triton/lib";

const trace = Tracer("[CoverTheme]");

import type { ItemId } from "neptune-types/tidal";

import transparent from "file://transparent.css?minify";

import { getPalette, type Palette } from "./vibrant.native";

const storage = getStorage("CoverTheme", {
	paletteCache: {},
	applyTheme: true,
});

const cachePalette = async (mediaItem: MediaItem): Promise<Palette | undefined> => {
	const album = await mediaItem.album();
	const coverUrl = album?.coverUrl("640");
	if (coverUrl === undefined) return;
	return ((storage.paletteCache as Record<string, Palette>)[album!.tidalAlbum!.cover!] ??= await getPalette(coverUrl));
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

export const Settings = () => {
	const [applyTheme, settApplyTheme] = React.useState(storage.applyTheme);
	React.useEffect(() => settApplyTheme(storage.applyTheme), [storage.applyTheme]);
	return (
		<TritonSwitch
			title={"Enable Theme"}
			desc={"Applies the theme to the client. If disabled css variables are still available for use"}
			checked={applyTheme}
			onChange={(_, checked) => {
				settApplyTheme((storage.applyTheme = checked));
				style.css = checked ? transparent : "";
			}}
		/>
	);
};

export const unloads = new Set<Unload>();
export const style = new StyleTag("CoverTheme", unloads, storage.applyTheme ? transparent : "");
setTimeout(() => MediaItem.fromPlaybackContext().then(updateBackground));

unloads.add(MediaItem.onMediaTransition(updateBackground));
unloads.add(MediaItem.onPreload(cachePalette));
unloads.add(MediaItem.onPreMediaTransition(updateBackground));
unloads.add(() => vars.forEach((variable) => document.documentElement.style.removeProperty(variable)));
