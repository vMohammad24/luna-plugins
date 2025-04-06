import type { ItemId } from "neptune-types/tidal";
import { MediaItem, type TMediaItemBase } from "./MediaItem";

export interface MediaCollection {
	mediaItemsCount(): Promise<number>;
	mediaItems(): Promise<AsyncGenerator<MediaItem, unknown, unknown>>;
	title(): Promise<string | undefined>;
}

export class MediaItems implements MediaCollection {
	private constructor(public readonly tMediaItems: TMediaItemBase[]) {}

	public static fromIds(itemIds: ItemId[]) {
		return new this(itemIds.map((id) => ({ item: { id }, type: "track" })));
	}
	public static fromTMediaItems(tMediaItems: TMediaItemBase[]) {
		return new this(tMediaItems);
	}

	public async title() {
		for await (const mediaItem of await this.mediaItems()) {
			const title = await mediaItem.title();
			if (title) return title;
		}
	}

	public async mediaItemsCount() {
		return this.tMediaItems.length;
	}
	public async mediaItems() {
		return MediaItem.fromTMediaItems(this.tMediaItems);
	}
}
