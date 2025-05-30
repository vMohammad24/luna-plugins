import { debounce } from "@inrixia/helpers";
import type { MediaItem } from "@luna/lib";
import { unloads } from "./index.safe";
import { ensureColumnHeader } from "./lib/ensureColumnHeader";
import { setColumn } from "./lib/setColumn";

export const setInfoColumnHeaders = debounce(() => {
	for (const trackList of document.querySelectorAll(`div[aria-label="Tracklist"]`)) {
		const bitDepthColumn = ensureColumnHeader(
			trackList,
			"Depth",
			`span[class^="_timeColumn"][role="columnheader"]`,
			`span[class^="_timeColumn"][role="columnheader"]`
		);
		bitDepthColumn?.style.setProperty("min-width", "40px");
		const sampleRateColumn = ensureColumnHeader(trackList, "Sample Rate", `span[class^="_timeColumn"][role="columnheader"]`, bitDepthColumn);
		sampleRateColumn?.style.setProperty("min-width", "110px");
		const bitrateColumn = ensureColumnHeader(trackList, "Bitrate", `span[class^="_timeColumn"][role="columnheader"]`, sampleRateColumn);
		bitrateColumn?.style.setProperty("min-width", "100px");
	}
}, 50);

export const setInfoColumns = (trackRow: Element, mediaItem: MediaItem) => {
	setInfoColumnHeaders();
	const bitDepthContent = document.createElement("span");
	const bitDepthColumn = setColumn(trackRow, "Depth", `div[data-test="duration"]`, bitDepthContent, `div[data-test="duration"]`);
	bitDepthColumn?.style.setProperty("min-width", "40px");

	const sampleRateContent = document.createElement("span");
	const sampleRateColumn = setColumn(trackRow, "Sample Rate", `div[data-test="duration"]`, sampleRateContent, bitDepthColumn);
	sampleRateColumn?.style.setProperty("min-width", "110px");

	const bitrateContent = document.createElement("span");
	const bitrateColumn = setColumn(trackRow, "Bitrate", `div[data-test="duration"]`, bitrateContent, sampleRateColumn);
	bitrateColumn?.style.setProperty("min-width", "100px");

	bitDepthContent.style.color = sampleRateContent.style.color = bitrateContent.style.color = mediaItem.bestQuality.color;

	mediaItem.withFormat(unloads, mediaItem.bestQuality.audioQuality, ({ sampleRate, bitDepth, bitrate }) => {
		if (!!sampleRate) sampleRateContent.textContent = `${sampleRate / 1000}kHz`;
		if (!!bitDepth) bitDepthContent.textContent = `${bitDepth}bit`;
		if (!!bitrate) bitrateContent.textContent = `${Math.floor(bitrate / 1000).toLocaleString()}kbps`;
	});
};
