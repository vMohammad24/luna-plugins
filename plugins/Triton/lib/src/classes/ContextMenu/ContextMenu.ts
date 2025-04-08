import { Tracer } from "../../helpers/trace";
const trace = Tracer("[lib.ContextMenu]");

import { runFor } from "@inrixia/helpers";
import { intercept } from "@neptune";

import styles from "file://ContextMenu.css?minify";
import { StyleTag } from "../../helpers/StyleTag";

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

	private static runListners<T>(listeners: Set<ContextHandler<T>>) {
		return async (items?: T) => {
			if (items === undefined) return;
			const contextMenu = await ContextMenu.getContextMenu();
			if (contextMenu === null) return;
			for (const listener of listeners) {
				listener(items, contextMenu).catch(trace.err.withContext("Executing listener", items, contextMenu));
			}
		};
	}

	private static _onMediaItem: Set<ContextHandler<MediaItems | Album | Playlist>> = new Set();
	public static onMediaItem(cb: ContextHandler<MediaItems | Album | Playlist>): () => void {
		ContextMenu._onMediaItem.add(cb);
		return () => ContextMenu._onMediaItem.delete(cb);
	}

	static {
		intercept(`contextMenu/OPEN_MEDIA_ITEM`, ([item]) => {
			ContextMenu.runListners(ContextMenu._onMediaItem)(MediaItems.fromIds([item.id]));
		});
		intercept(`contextMenu/OPEN_MULTI_MEDIA_ITEM`, ([items]) => {
			ContextMenu.runListners(ContextMenu._onMediaItem)(MediaItems.fromIds(items.ids));
		});
		intercept("contextMenu/OPEN", ([info]) => {
			switch (info.type) {
				case "ALBUM": {
					Album.fromId(info.id).then(ContextMenu.runListners(ContextMenu._onMediaItem)).catch(trace.err.withContext("contextMenu/OPEN", "Album", info));
					break;
				}
				case "PLAYLIST": {
					Playlist.fromId(info.id).then(ContextMenu.runListners(ContextMenu._onMediaItem)).catch(trace.err.withContext("contextMenu/OPEN", "Playlist", info));
					break;
				}
			}
		});
	}
}
