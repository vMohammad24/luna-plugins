import { Tracer } from "../helpers/trace";
const trace = Tracer("[lib.Artist]");

import { actions } from "@neptune";
import { interceptPromise } from "../intercept/interceptPromise";
import { ContentBase, type TImageSize } from "./ContentBase";

import type { ItemId, Artist as TArtist } from "neptune-types/tidal";

class Artist extends ContentBase {
	constructor(public readonly id: ItemId, public readonly tidalArtist: TArtist) {
		super();
	}
	public static async fromId(artistId?: ItemId): Promise<Artist | undefined> {
		if (artistId === undefined) return;
		const album = super.fromStore(artistId, "artists", this);
		if (album !== undefined) return album;

		await interceptPromise(() => actions.content.loadArtist({ artistId }), ["content/LOAD_ARTIST_SUCCESS"], []).catch(trace.warn.withContext("fromId", artistId));

		return super.fromStore(artistId, "artists", this);
	}

	public coverUrl(res?: TImageSize) {
		if (this.tidalArtist.picture === undefined) return;
		return ContentBase.formatCoverUrl(this.tidalArtist.picture, res);
	}

	public get name() {
		return this.tidalArtist.name;
	}
}

// @ts-expect-error Ensure window.Estr is prepped
window.Estr ??= {};
// @ts-expect-error Always use the shared class
Artist = window.Estr.Artist ??= Artist;
export default Artist;
