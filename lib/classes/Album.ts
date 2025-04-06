import { Tracer } from "../helpers/trace";
const trace = Tracer("[lib.Album]");

import { memoize } from "@inrixia/helpers";
import { requestJson } from "@inrixia/lib.native";

import { actions } from "@neptune";
import type { ItemId, Album as TAlbum, MediaItem as TMediaItem } from "neptune-types/tidal";

import type { IReleaseMatch } from "musicbrainz-api";

import { interceptPromise } from "../intercept/interceptPromise";

import { Artist } from "./Artist";
import { ContentBase, type TImageSize } from "./ContentBase";
import { MediaItem } from "./MediaItem";

export class Album extends ContentBase {
	constructor(public readonly id: ItemId, public readonly tidalAlbum: TAlbum) {
		super();
	}
	public static async fromId(albumId?: ItemId): Promise<Album | undefined> {
		if (albumId === undefined) return;
		const album = super.fromStore(albumId, "albums", this);
		if (album !== undefined) return album;

		await interceptPromise(() => actions.content.loadAlbum({ albumId }), ["content/LOAD_ALBUM_SUCCESS"], []).catch(trace.warn.withContext("fromId", albumId));

		return super.fromStore(albumId, "albums", this);
	}

	public brainzAlbum: () => Promise<IReleaseMatch | undefined> = memoize(async () => {
		if (this.tidalAlbum.upc === undefined) return;

		const brainzAlbum = await requestJson<{ releases: IReleaseMatch[] }>(`https://musicbrainz.org/ws/2/release/?query=barcode:${this.tidalAlbum.upc}&fmt=json`)
			.then(({ releases }) => releases[0])
			.catch(trace.warn.withContext("getUPCReleases"));

		// @ts-expect-error musicbrainz-api lib missing types
		const trackCount: number = brainzAlbum?.["track-count"];

		const brainzTrackCount = trackCount ?? brainzAlbum?.media?.reduce((count, album) => (count += album?.["track-count"] ?? 0), 0);

		// Try validate if the album is valid because sometimes tidal has the wrong upc id!
		if (brainzTrackCount !== undefined && this.tidalAlbum.numberOfTracks === brainzTrackCount) {
			return brainzAlbum;
		}

		trace.warn("Invalid Tidal UPC for album!", { releaseAlbum: brainzAlbum, tidalAlbum: this });
	});

	public artist: () => Promise<Artist | undefined> = memoize(async () => {
		if (this.tidalAlbum.artist?.id) return Artist.fromId(this.tidalAlbum.artist.id);
		if (this.tidalAlbum.artists?.[0]?.id) return Artist.fromId(this.tidalAlbum.artists?.[0].id);
	});
	public artists: () => Promise<Artist | undefined>[] = memoize(() => {
		return this.tidalAlbum.artists?.map((artist) => Artist.fromId(artist.id)) ?? [];
	});

	public mediaItems: () => Promise<MediaItem[]> = memoize(async () => {
		const result = await interceptPromise(
			() => actions.content.loadAllAlbumMediaItems({ albumId: this.tidalAlbum.id! }),
			["content/LOAD_ALL_ALBUM_MEDIA_ITEMS_SUCCESS"],
			["content/LOAD_ALL_ALBUM_MEDIA_ITEMS_FAIL"]
		).catch(trace.warn.withContext("getMediaItems.interceptPromise", this));
		const tMediaItems = <Immutable.List<TMediaItem>>result?.[0]?.mediaItems;
		if (tMediaItems === undefined) return [];
		return MediaItem.fromTMediaItems(Array.from(tMediaItems));
	});

	public coverUrl(res?: TImageSize) {
		if (this.tidalAlbum.cover === undefined) return;
		return ContentBase.formatCoverUrl(this.tidalAlbum.cover, res);
	}

	public title: () => Promise<string | undefined> = memoize(async () => {
		const brainzAlbum = await this.brainzAlbum();
		return ContentBase.formatTitle(this.tidalAlbum.title, this.tidalAlbum.version, brainzAlbum?.title, brainzAlbum?.["artist-credit"]);
	});

	public upc: () => Promise<string | undefined> = memoize(async () => {
		return this.tidalAlbum.upc ?? (await this.brainzAlbum())?.barcode;
	});

	public async brainzId(): Promise<string | undefined> {
		return (await this.brainzAlbum())?.id;
	}

	public get genre(): string | undefined {
		return this.tidalAlbum.genre;
	}
	public get recordLabel(): string | undefined {
		return this.tidalAlbum.recordLabel;
	}
	public get totalTracks(): number | undefined {
		return this.tidalAlbum.numberOfTracks;
	}
	public get releaseDate(): string | undefined {
		return this.tidalAlbum.releaseDate ?? this.tidalAlbum.streamStartDate;
	}
	public get releaseYear(): string | undefined {
		return this.tidalAlbum.releaseYear;
	}
}
