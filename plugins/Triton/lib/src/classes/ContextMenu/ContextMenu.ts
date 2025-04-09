import { Tracer } from "../../helpers/trace";
const trace = Tracer("[lib.ContextMenu]");

import { runFor } from "@inrixia/helpers";

import styles from "file://ContextMenu.css?minify";

import { registerEmitter, StyleTag } from "../../helpers";
import { safeIntercept } from "../../intercept/safeIntercept";
import { tritonUnloads } from "../../unloads";

import { Album } from "../Album";
import { MediaItems } from "../MediaCollection";
import { Playlist } from "../Playlist";

new StyleTag("content-button", styles);

type ContextHandler<T> = (item: T, contextMenu: Element) => Promise<void>;
export class ContextMenu {
	// Must be async to Queue to eventloop to ensure element exists on document
	private static async getContextMenu() {
		let contextMenu: Element | null = null;
		// Try get menu from dom for 1s
		await runFor(() => {
			contextMenu = document.querySelector(`[data-type="list-container__context-menu"]`);
			if (contextMenu !== null) return true;
		}, 1000);
		return contextMenu;
	}

	public static onMediaItem = registerEmitter<{ mediaCollection: MediaItems | Album | Playlist; contextMenu: Element }>((onMediaItem) => {
		safeIntercept(
			`contextMenu/OPEN_MEDIA_ITEM`,
			async (item, type) => {
				const contextMenu = await ContextMenu.getContextMenu();
				if (contextMenu === null) return;
				onMediaItem({ mediaCollection: MediaItems.fromIds([item.id]), contextMenu }, trace.err.withContext(type, contextMenu));
			},
			tritonUnloads
		);
		safeIntercept(
			`contextMenu/OPEN_MULTI_MEDIA_ITEM`,
			async (items, type) => {
				const contextMenu = await ContextMenu.getContextMenu();
				if (contextMenu === null) return;
				onMediaItem({ mediaCollection: MediaItems.fromIds(items.ids), contextMenu }, trace.err.withContext(type, contextMenu));
			},
			tritonUnloads
		);
		safeIntercept(
			"contextMenu/OPEN",
			async (info, type) => {
				const contextMenu = await ContextMenu.getContextMenu();
				if (contextMenu === null) return;
				switch (info.type) {
					case "ALBUM": {
						const album = await Album.fromId(info.id);
						if (album === undefined) return;
						onMediaItem({ mediaCollection: album, contextMenu }, trace.err.withContext(type, contextMenu));
						break;
					}
					case "PLAYLIST": {
						const playlist = await Playlist.fromId(info.id);
						if (playlist === undefined) return;
						onMediaItem({ mediaCollection: playlist, contextMenu }, trace.err.withContext(type, contextMenu));
						break;
					}
				}
			},
			tritonUnloads
		);
	});
}
