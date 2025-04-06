import { Tracer } from "../helpers/trace";
const trace = Tracer("[PlaylistCache]");

import { asyncDebounce } from "@inrixia/helpers";
import { actions } from "@neptune";
import { interceptPromise } from "../intercept/interceptPromise";
import { ContentBase } from "./ContentBase";

import type { ItemId, MediaItem as TMediaItem, Playlist as TPlaylist } from "neptune-types/tidal";
import { MediaItem } from "./MediaItem";

import type { MediaCollection } from "./MediaCollection";

export class Playlist extends ContentBase implements MediaCollection {
	constructor(public readonly uuid: ItemId, public readonly tidalPlaylist: TPlaylist) {
		super();
	}

	public static async fromId(playlistUUID?: ItemId) {
		if (playlistUUID === undefined) return;
		return super.fromStore(playlistUUID, "playlists", this);
	}

	public async title() {
		return this.tidalPlaylist.title;
	}

	public async mediaItemsCount() {
		return (await this.tMediaItems()).length;
	}
	public async mediaItems() {
		return MediaItem.fromTMediaItems(await this.tMediaItems());
	}
	public tMediaItems: () => Promise<TMediaItem[]> = asyncDebounce(async () => {
		const result = await interceptPromise(
			() => actions.content.loadListItemsPage({ loadAll: true, listName: `playlists/${this.uuid}`, listType: "mediaItems" }),
			[
				"content/LOAD_LIST_ITEMS_PAGE_SUCCESS",
				// @ts-expect-error Outdated types
				"content/LOAD_LIST_ITEMS_PAGE_SUCCESS_MODIFIED",
			],
			["content/LOAD_LIST_ITEMS_PAGE_FAIL"]
		).catch(trace.warn.withContext("getTrackItems.interceptPromise", `playlists/${this.uuid}`));

		const tMediaItems: Immutable.List<TMediaItem> = result?.[0]?.items;
		if (tMediaItems === undefined) return [];
		return Array.from(tMediaItems);
	});
}
