import { Tracer, type LunaUnload } from "@luna/core";
import { ContextMenu, safeInterval, StyleTag } from "@luna/lib";

import { join } from "path";

import { getDownloadFolder, getDownloadPath, getFileName } from "./helpers";
import { settings } from "./Settings";

import styles from "file://downloadButton.css?minify";

export const { errSignal, trace } = Tracer("[SongDownloader]");
export const unloads = new Set<LunaUnload>();

new StyleTag("SongDownloader", unloads, styles);

export { Settings } from "./Settings";
ContextMenu.onMediaItem(unloads, async ({ mediaCollection, contextMenu }) => {
	const trackCount = await mediaCollection.count();
	if (trackCount === 0) return;

	const defaultText = `Download ${trackCount} tracks`;
	const downloadButton = contextMenu.addButton(defaultText, async () => {
		const downloadFolder = settings.defaultPath ?? (trackCount > 1 ? await getDownloadFolder() : undefined);
		downloadButton.classList.add("download-button");
		for await (let mediaItem of await mediaCollection.mediaItems()) {
			if (settings.useRealMAX) {
				downloadButton.innerText = `Checking RealMax...`;
				mediaItem = (await mediaItem.max()) ?? mediaItem;
			}

			downloadButton.innerText = `Loading tags...`;
			await mediaItem.flacTags();

			downloadButton.innerText = `Fetching filename...`;
			const fileName = await getFileName(mediaItem);

			downloadButton.innerText = `Fetching download path...`;
			const path = downloadFolder !== undefined ? join(downloadFolder, fileName) : await getDownloadPath(fileName);
			if (path === undefined) return;

			downloadButton.innerText = `Downloading...`;
			const clearInterval = safeInterval(
				unloads,
				async () => {
					const progress = await mediaItem.downloadProgress();
					if (progress === undefined) return;
					const { total, downloaded } = progress;
					if (total === undefined || downloaded === undefined) return;
					const percent = (downloaded / total) * 100;
					downloadButton.style.setProperty("--progress", `${percent}%`);
					const downloadedMB = (downloaded / 1048576).toFixed(0);
					const totalMB = (total / 1048576).toFixed(0);
					downloadButton.innerText = `Downloading... ${downloadedMB}/${totalMB}MB ${percent.toFixed(0)}%`;
				},
				50
			);
			await mediaItem.download(path);
			clearInterval();
		}
		downloadButton.innerText = defaultText;
		downloadButton.classList.remove("download-button");
	});
});
