import { Tracer } from "../helpers/trace";
const trace = Tracer("[lib.ContextMenu]");

import { runFor } from "@inrixia/helpers";
import { intercept } from "@neptune";
import { Album, MediaItem, Playlist } from "..";

import "./contentButton.styles";

type Item = MediaItem | Album | Playlist;
type ContextListener = (item: Item[], contextMenu: Element) => Promise<void>;
export class ContextMenu {
	private static readonly _intercepts = [
		intercept(`contextMenu/OPEN_MEDIA_ITEM`, ([mediaItem]) => this._onOpen([MediaItem.fromId(mediaItem.id)])),
		intercept(`contextMenu/OPEN_MULTI_MEDIA_ITEM`, ([mediaItems]) => this._onOpen(mediaItems.ids.map((itemId) => MediaItem.fromId(itemId)))),
		intercept("contextMenu/OPEN", ([info]) => {
			switch (info.type) {
				case "ALBUM": {
					return this._onOpen([Album.fromId(info.id)]);
				}
				case "PLAYLIST": {
					return this._onOpen([Playlist.fromId(info.id)]);
				}
			}
		}),
	];
	private static _onOpen(estrItems: Promise<Item | undefined>[]): void {
		// Queue to eventloop to ensure element exists on document
		setTimeout(async () => {
			let contextMenu: Element | null;
			// Try get menu from dom for 1s
			await runFor(() => {
				contextMenu = document.querySelector(`[data-type="list-container__context-menu"]`);
				if (contextMenu !== null) return true;
			}, 1000);
			if (contextMenu! === null) return;

			const fEstrItems = [];
			for (const estrItem of estrItems) {
				const item = await estrItem.catch(trace.err.withContext("onOpen"));
				if (item) fEstrItems.push(item);
			}
			for (const listener of this._listeners) {
				listener(fEstrItems, contextMenu!).catch(trace.err.withContext("Executing listener", fEstrItems, contextMenu!));
			}
		});
	}
	private static _listeners: ContextListener[] = [];
	public static onOpen(listener: ContextListener): void {
		ContextMenu._listeners.push(listener);
	}
	public static onUnload(): void {
		this._intercepts.forEach((unload) => unload());
	}
}
