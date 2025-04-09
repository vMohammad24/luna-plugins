import { Tracer } from "../helpers/trace";
const trace = Tracer("[lib.ContextMenu]");

import { registerEmitter, type AddReceiver } from "../helpers";
import { safeIntercept } from "../intercept/safeIntercept";
import { tritonUnloads } from "../unloads";

import type { ActionTypes } from "neptune-types/tidal";
import { observePromise } from "../helpers/observable";
import { Album } from "./Album";
import { MediaItems } from "./MediaCollection";
import { Playlist } from "./Playlist";

type ExtendedElem = Element & { addButton: (text: string, onClick: (this: GlobalEventHandlers, ev: MouseEvent) => unknown) => HTMLSpanElement };
export class ContextMenu {
	private static async getContextMenu() {
		const contextMenu = await observePromise<ExtendedElem>(`[data-type="list-container__context-menu"]`, 1000);
		if (contextMenu !== null) {
			contextMenu.addButton = (text, onClick) => {
				const newButton = contextMenu.children[0].cloneNode(true);
				newButton.querySelector("a")!.href = "";
				const span = newButton.querySelector("span")!;
				span.innerText = text;
				span.onclick = onClick;
				contextMenu.appendChild(newButton);
				return span;
			};
		}
		return contextMenu;
	}

	public static onOpen: AddReceiver<{ event: ActionTypes["contextMenu/OPEN"]; contextMenu: ExtendedElem }> = registerEmitter((onOpen) => {
		safeIntercept(
			"contextMenu/OPEN",
			async (event, type) => {
				const contextMenu = await ContextMenu.getContextMenu();
				if (contextMenu === null) return;
				onOpen({ event, contextMenu }, trace.err.withContext(type, event.type, contextMenu));
			},
			tritonUnloads
		);
	});

	public static onMediaItem: AddReceiver<{ mediaCollection: MediaItems | Album | Playlist; contextMenu: ExtendedElem }> = registerEmitter((onMediaItem) => {
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
		ContextMenu.onOpen(async ({ event, contextMenu }) => {
			switch (event.type) {
				case "ALBUM": {
					const album = await Album.fromId(event.id);
					if (album === undefined) return;
					onMediaItem({ mediaCollection: album, contextMenu }, trace.err.withContext(event.type, contextMenu));
					break;
				}
				case "PLAYLIST": {
					const playlist = await Playlist.fromId(event.id);
					if (playlist === undefined) return;
					onMediaItem({ mediaCollection: playlist, contextMenu }, trace.err.withContext(event.type, contextMenu));
					break;
				}
			}
		});
	});
}
