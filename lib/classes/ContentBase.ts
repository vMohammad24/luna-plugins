import { store } from "@neptune";
import type { IArtistCredit } from "musicbrainz-api";
import type { ContentStateFields, ItemId } from "neptune-types/tidal";
import { EstrCache } from "../EstrCache";
import type { Artist } from "./Artist";

type ContentType = keyof ContentStateFields;
type ContentItem<K extends ContentType> = Exclude<ReturnType<ContentStateFields[K]["get"]>, undefined>;
type ContentClass<K extends ContentType> = {
	new (itemId: ItemId, contentItem: ContentItem<K>): any;
};
export type TImageSize = "1280" | "640" | "320" | "160" | "80";

export class ContentBase {
	private static readonly _instances: Record<string, Record<ItemId, ContentClass<ContentType>>> = EstrCache.subCache("instances");

	protected static fromStore<K extends ContentType, C extends ContentClass<K>, I extends InstanceType<C>>(itemId: ItemId, contentType: K, clss: C): I | undefined {
		if (this._instances[contentType]?.[itemId] !== undefined) return this._instances[contentType][itemId] as I;
		const storeContent = store.getState().content;
		const contentItem = storeContent[contentType][itemId as keyof ContentStateFields[K]] as ContentItem<K>;
		if (contentItem !== undefined) {
			this._instances[contentType] ??= {};
			return (this._instances[contentType][itemId] ??= new clss(itemId, contentItem)) as I;
		}
	}

	protected static formatTitle(tidalTitle?: string, tidalVersion?: string, brainzTitle?: string, brainzCredit?: IArtistCredit[]): string | undefined {
		brainzTitle = brainzTitle?.replaceAll("’", "'");

		let title = brainzTitle ?? tidalTitle;
		if (title === undefined) return undefined;

		// If the title has feat and its validated by musicBrainz then use the tidal title.
		if (tidalTitle?.includes("feat. ") && !brainzTitle?.includes("feat. ")) {
			const mbHasFeat = brainzCredit && brainzCredit.findIndex((credit) => credit.joinphrase === " feat. ") !== -1;
			if (mbHasFeat) title = tidalTitle;
		}

		// Dont use musicBrainz disambiguation as its not the same as the tidal version!
		if (tidalVersion && !title.toLowerCase().includes(tidalVersion.toLowerCase())) title += ` (${tidalVersion})`;

		return title;
	}

	protected static formatCoverUrl(uuid?: string, res: TImageSize = "1280") {
		if (uuid) return `https://resources.tidal.com/images/${uuid.split("-").join("/")}/${res}x${res}.jpg`;
	}

	public static async artistNames(artists?: Promise<Promise<Artist | undefined>[]> | Promise<Artist | undefined>[]): Promise<string[]> {
		const _artists = await artists;
		if (!_artists) return [];
		const artistNames = [];
		for await (const artist of _artists) {
			if (artist?.name) artistNames.push(artist?.name);
		}
		return artistNames;
	}
}
