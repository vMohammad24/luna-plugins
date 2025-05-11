import { Vibrant } from "node-vibrant/node";

export type Palette = Record<string, RGBSwatch>;
export type RGBSwatch = [r: number, g: number, b: number];
export const getPalette = async (coverUrl: string) => {
	const vibrantPalette = await new Vibrant(coverUrl, { quality: 1, useWorker: false }).getPalette();
	const palette: Palette = {};
	for (const color in vibrantPalette) {
		const swatch = vibrantPalette[color];
		if (swatch) palette[color] = swatch.rgb;
	}
	return palette;
};
