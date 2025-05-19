import { Tracer, type LunaUnload } from "@luna/core";
import { ContextMenu } from "@luna/lib";

import { join } from "path";

import { getDownloadFolder, getDownloadPath, getFileName } from "./helpers";
import { settings } from "./Settings";

export const { errSignal, trace } = Tracer("[SongDownloader]");
export const unloads = new Set<LunaUnload>();

export { Settings } from "./Settings";

ContextMenu.onMediaItem(unloads, async ({ mediaCollection, contextMenu }) => {
	const trackCount = await mediaCollection.count();
	if (trackCount === 0) return;

	contextMenu.addButton(`Download ${trackCount} tracks`, async () => {
		const downloadFolder = settings.defaultPath ?? (trackCount > 1 ? await getDownloadFolder() : undefined);
		for await (const mediaItem of await mediaCollection.mediaItems()) {
			const fileName = await getFileName(mediaItem);
			const path = downloadFolder !== undefined ? join(downloadFolder, fileName) : await getDownloadPath(fileName);
			if (path === undefined) return;
			await mediaItem.download(path);
		}
	});
});
