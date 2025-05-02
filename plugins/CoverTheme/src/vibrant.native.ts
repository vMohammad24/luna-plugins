import { Vibrant } from "node-vibrant/node";

export type Palette = { [key: string]: string };
export const getPalette = async (coverUrl: string) => {
	const vibrant = new Vibrant(coverUrl, { quality: 1, useWorker: false });
	const palette = await vibrant.getPalette();
	const colors: Palette = {};
	for (const colorName in palette) {
		const color = palette[colorName];
		if (!color) continue;
		colors[colorName] = color.rgb.join(", ");
	}
	return colors;
};
