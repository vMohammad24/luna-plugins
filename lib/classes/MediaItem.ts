import { Tracer } from "../helpers/trace";
const trace = Tracer("[lib.MediaItem]");

import { actions, intercept } from "@neptune";
import { PayloadActionTypeTuple } from "neptune-types/api/intercept";

import { asyncDebounce, memoize } from "@inrixia/helpers";
import { getStreamBytes, parseStreamMeta } from "@inrixia/lib.native";

import { ContentBase, type TImageSize } from "./ContentBase";
import { getPlaybackInfo } from "./MediaItem.playbackInfo";
import { type PlaybackInfo } from "./MediaItem.playbackInfo.types";
import { makeTags, MetaTags } from "./MediaItem.tags";
import { Quality, type MediaItemAudioQuality, type MediaMetadataTag } from "./Quality";

import { requestJsonCached } from "../helpers/requestJsonCached";
import { interceptPromise } from "../intercept/interceptPromise";
import { SharedObjectStoreExpirable } from "../storage/SharedObjectStoreExpirable";
import { fetchIsrcIterable } from "../tidalApi";

import type { IRecording, IRelease, ITrack } from "musicbrainz-api";
import type { ItemId, MediaItem as TMediaItem } from "neptune-types/tidal";

import { Album } from "./Album";
import { Artist } from "./Artist";
import { type PlaybackContext } from "./PlayState";

export type MediaItemListener = (mediaItem: MediaItem) => unknown;
export const runListeners = (item: MediaItem, listeners: Set<MediaItemListener>, errorHandler: typeof console.error) => {
	const listenerPromises = [];
	for (const listener of listeners) {
		try {
			const res = listener(item);
			if (res instanceof Promise) {
				res.catch(errorHandler);
				listenerPromises.push(res);
			}
		} catch (err) {
			errorHandler(err);
		}
	}
	return Promise.allSettled<void>(listenerPromises);
};

type TLyrics = PayloadActionTypeTuple<"content/LOAD_ITEM_LYRICS_SUCCESS">[0];

type MediaFormat = {
	bitDepth?: number;
	sampleRate?: number;
	codec?: string;
	duration?: number;
	bytes?: number;
	bitrate?: number;
};

type MediaItemType = TMediaItem["type"];

export class MediaItem extends ContentBase {
	public readonly tidalItem: Readonly<TMediaItem["item"]>;
	public readonly duration?: number;
	constructor(public readonly id: ItemId, tidalMediaItem: TMediaItem) {
		super();
		this.tidalItem = tidalMediaItem.item;
		this.duration = this.tidalItem.duration;
	}
	private static async tryLoad(itemId: ItemId, contentType: MediaItemType) {
		const currentPage = window.location.pathname;
		const loadedTrack = await interceptPromise(() => neptune.actions.router.replace(<any>`/track/${itemId}`), ["page/IS_DONE_LOADING"], [])
			.then(() => true)
			.catch(trace.warn.withContext(`ensure failed to load track`, itemId));
		// If we fail to load the track, maybe its a video, try that instead as a last ditch attempt
		if (!loadedTrack && contentType === "video") {
			await interceptPromise(() => neptune.actions.router.replace(<any>`/video/${itemId}`), ["page/IS_DONE_LOADING"], []).catch(trace.warn.withContext(`ensure failed to load video`, itemId));
		}
		setTimeout(() => neptune.actions.router.replace(<any>currentPage));
	}

	public static async fromId(itemId?: ItemId, contentType: MediaItemType = "track"): Promise<MediaItem | undefined> {
		if (itemId === undefined) return;
		const mediaItem = super.fromStore(itemId, "mediaItems", this);
		if (mediaItem !== undefined) return mediaItem;

		// Try force Tidal client to load mediaItem into store
		await this.tryLoad(itemId, contentType);
		return super.fromStore(itemId, "mediaItems", this);
	}
	public static async fromTMediaItems(tMediaItems: TMediaItem[]): Promise<MediaItem[]> {
		const mediaItems = [];
		for (const tMediaItem of tMediaItems) {
			const mediaItem = await this.fromId(tMediaItem.item.id, tMediaItem.type);
			if (mediaItem !== undefined) mediaItems.push(mediaItem);
		}
		return mediaItems;
	}
	public static async fromPlaybackContext(playbackContext?: PlaybackContext) {
		// This has to be here to avoid ciclic requirements breaking
		playbackContext ??= neptune.store.getState().playbackControls.playbackContext as PlaybackContext;
		if (playbackContext?.actualProductId === undefined) return undefined;
		const mediaItem = await this.fromId(playbackContext.actualProductId, playbackContext.actualVideoQuality === null ? "track" : "video");
		mediaItem?.setFormatAttrs({
			bitDepth: playbackContext.bitDepth ?? undefined,
			sampleRate: playbackContext.sampleRate ?? undefined,
			duration: playbackContext.actualDuration ?? undefined,
			codec: playbackContext.codec ?? undefined,
		});
		return mediaItem;
	}

	public album: () => Promise<Album | undefined> = memoize(async () => {
		if (this.tidalItem.album?.id) return Album.fromId(this.tidalItem.album?.id);
	});
	public artist: () => Promise<Artist | undefined> = memoize(async () => {
		if (this.tidalItem.artist?.id) return Artist.fromId(this.tidalItem.artist.id);
		if (this.tidalItem.artists?.[0]?.id) return Artist.fromId(this.tidalItem.artists?.[0].id);
		return (await this.album())?.artist();
	});
	public artists: () => Promise<Promise<Artist | undefined>[]> = memoize(async () => {
		if (this.tidalItem.artists) return this.tidalItem.artists.map((artist) => Artist.fromId(artist.id));
		return (await this.album())?.artists() ?? [];
	});

	public isrcs: () => Promise<Set<string>> = memoize(async () => {
		const isrcs = new Set<string>();
		const brainzItem = await this.brainzItem();
		if (brainzItem?.recording.isrcs) isrcs.add(brainzItem.recording.isrcs[brainzItem.recording.isrcs.length - 1]);

		if (this.tidalItem.isrc) isrcs.add(this.tidalItem.isrc);

		return isrcs;
	});
	public isrc: () => Promise<string | undefined> = memoize(async () => {
		for (const isrc of await this.isrcs()) return isrc;
	});

	public lyrics: () => Promise<TLyrics | undefined> = memoize(async () =>
		interceptPromise(() => actions.content.loadItemLyrics({ itemId: this.tidalItem.id!, itemType: "track" }), ["content/LOAD_ITEM_LYRICS_SUCCESS"], ["content/LOAD_ITEM_LYRICS_FAIL"])
			.catch(trace.warn.withContext("loadItemLyrics"))
			.then((res) => res?.[0])
	);

	public brainzItem: () => Promise<ITrack | undefined> = memoize(async () => {
		const releaseTrackFromRecording = async (recording: IRecording) => {
			// If a recording exists then fetch the full recording details including media for title resolution
			const release = await requestJsonCached<IRecording>(`https://musicbrainz.org/ws/2/recording/${recording.id}?inc=releases+media+artist-credits+isrcs&fmt=json`)
				.then(({ releases }) => releases?.filter((release) => release["text-representation"].language === "eng")[0] ?? releases?.[0])
				.catch(trace.warn.withContext("brainzItem.getISRCRecordings"));
			if (release === undefined) return undefined;

			const releaseTrack = release.media?.[0].tracks?.[0];
			releaseTrack.recording ??= recording;
			return releaseTrack;
		};

		if (this.tidalItem.isrc !== undefined) {
			// Lookup the recording from MusicBrainz by ISRC
			const recording = await requestJsonCached<{ recordings: IRecording[] }>(`https://musicbrainz.org/ws/2/isrc/${this.tidalItem.isrc}?inc=isrcs&fmt=json`)
				.then(({ recordings }) => recordings[0])
				.catch(trace.warn.withContext("brainzItem.getISRCRecordings"));

			if (recording !== undefined) return releaseTrackFromRecording(recording);
		}

		const album = await this.album();
		const brainzAlbum = await album?.brainzAlbum();
		if (brainzAlbum === undefined) return undefined;

		const albumRelease = await requestJsonCached<IRelease>(`https://musicbrainz.org/ws/2/release/${brainzAlbum.id}?inc=recordings+isrcs+artist-credits&fmt=json`).catch(
			trace.warn.withContext("brainzItem.getReleaseAlbum")
		);

		const volumeNumber = (this.tidalItem.volumeNumber ?? 1) - 1;
		const trackNumber = (this.tidalItem.trackNumber ?? 1) - 1;

		let brainzItem = albumRelease?.media?.[volumeNumber]?.tracks?.[trackNumber];
		// If this is not the english version of the release try to find the english version of the release track
		if (albumRelease?.["text-representation"].language !== "eng" && brainzItem?.recording !== undefined) {
			return (brainzItem = await releaseTrackFromRecording(brainzItem.recording));
		}
		return brainzItem;
	});

	public get trackNumber(): number | undefined {
		return this.tidalItem.trackNumber;
	}
	public get volumeNumber(): number | undefined {
		return this.tidalItem.volumeNumber;
	}
	public get replayGainPeak(): number | undefined {
		return this.tidalItem.peak;
	}
	public get replayGain(): number | undefined {
		if (this.tidalItem.contentType !== "track") return;
		return this.tidalItem.replayGain;
	}
	public get url(): string | undefined {
		return this.tidalItem.url;
	}
	public get copyright(): string | undefined {
		if (this.tidalItem.contentType !== "track") return;
		return this.tidalItem.copyright;
	}
	public get bpm(): number | undefined {
		// @ts-expect-error BPM is now present on some tracks
		return this.tidalItem.bpm;
	}

	public get qualityTags(): Quality[] {
		if (this.tidalItem.contentType !== "track") return [];
		return Quality.fromMetaTags(this.tidalItem.mediaMetadata?.tags);
	}
	public get quality(): Quality {
		if (this.tidalItem.contentType !== "track" || this.tidalItem.audioQuality === undefined) {
			trace.warn("MediaItem quality called on non-track or item missing audioQuality!", this);
			return Quality.High;
		}
		return Quality.fromAudioQuality(this.tidalItem.audioQuality);
	}

	public title: () => Promise<string | undefined> = memoize(async () => {
		const brainzItem = await this.brainzItem();
		return ContentBase.formatTitle(this.tidalItem.title, this.tidalItem.version, brainzItem?.title, brainzItem?.["artist-credit"]);
	});
	public releaseDate: () => Promise<Date | undefined> = memoize(async () => {
		let releaseDate = this.tidalItem.releaseDate ?? this.tidalItem.streamStartDate;
		if (releaseDate === undefined) {
			const brainzItem = await this.brainzItem();
			releaseDate = brainzItem?.recording?.["first-release-date"];
		}
		if (releaseDate === undefined) {
			const album = await this.album();
			releaseDate = album?.releaseDate;
			releaseDate ??= (await album?.brainzAlbum())?.date;
		}
		if (releaseDate) return new Date(releaseDate);
	});
	/**
	 * "year-month-day"
	 */
	public releaseDateStr: () => Promise<string | undefined> = memoize(async () => {
		return (await this.releaseDate())?.toISOString().slice(0, 10);
	});
	public coverUrl: (res?: TImageSize) => Promise<string | undefined> = memoize(async (res) => {
		if (this.tidalItem.album?.cover) return ContentBase.formatCoverUrl(this.tidalItem.album?.cover, res);
		const album = await this.album();
		return album?.coverUrl();
	});
	public brainzId: () => Promise<string | undefined> = memoize(async () => {
		const brainzItem = await this.brainzItem();
		return brainzItem?.recording.id;
	});

	public flacTags: () => Promise<MetaTags> = memoize(() => makeTags(this));
	public max: () => Promise<MediaItem | undefined> = memoize(async () => {
		if (this.quality >= Quality.Max) return;

		const isrcs = await this.isrcs();
		if (isrcs.size === 0) return;

		let bestQuality: MediaItem = this;
		for (const isrc of isrcs) {
			for await (const track of fetchIsrcIterable(isrc)) {
				// If quality is higher than current best, set as best
				const maxTrackQuality = Quality.max(...Quality.fromMetaTags(track.attributes.mediaTags as MediaMetadataTag[]));
				if (maxTrackQuality > bestQuality.quality) {
					bestQuality = (await MediaItem.fromId(track.id)) ?? bestQuality;
					if (bestQuality.quality >= Quality.Max) return bestQuality;
				}
			}
		}
		// Dont return self
		if (bestQuality.id === this.id) return undefined;
		return bestQuality;
	});

	public playbackInfo: () => Promise<PlaybackInfo> = memoize(async () => {
		const playbackInfo = await getPlaybackInfo(this);
		this.setFormatAttrs(playbackInfo);
		return playbackInfo;
	});

	private static readonly formatStore: SharedObjectStoreExpirable<[trackId: number, audioQuality: MediaItemAudioQuality], MediaFormat>;
	private setFormatAttrs(mediaFormat: MediaFormat): void {
		type N = number | undefined;

		(this.bytes as N) = mediaFormat.bytes ?? this.bytes;
		(this.bitDepth as N) = mediaFormat.bitDepth ?? this.bitDepth;
		(this.sampleRate as N) = mediaFormat.sampleRate ?? this.sampleRate;
		(this.duration as N) = mediaFormat.duration ?? this.duration;

		(this.codec as string | undefined) = mediaFormat.codec ?? this.codec;

		if (this.bytes && this.duration) (this.bitrate as number) ??= (this.bytes / this.duration) * 8;

		runListeners(this, MediaItem.onFormatUpdateListeners, trace.err.withContext("setFormatAttrs.runListeners"));
	}
	private updateFormat: () => Promise<void> = asyncDebounce(async () => {
		const playbackInfo = await this.playbackInfo();

		const mediaFormat: MediaFormat = {};

		if (this.bitDepth === undefined || this.sampleRate === undefined || this.duration === undefined) {
			const { format, bytes } = await parseStreamMeta(playbackInfo);

			mediaFormat.bytes = bytes;

			mediaFormat.bitDepth = format.bitsPerSample ?? this.bitDepth;
			mediaFormat.sampleRate = format.sampleRate ?? this.sampleRate;
			mediaFormat.duration = format.duration ?? this.duration;

			mediaFormat.codec = format.codec?.toLowerCase() ?? this.codec;

			if (playbackInfo.manifestMimeType === "application/dash+xml") {
				mediaFormat.bitrate = playbackInfo.manifest.tracks.audios[0].bitrate.bps ?? this.bitrate;
				mediaFormat.bytes = playbackInfo.manifest.tracks.audios[0].size?.b ?? this.bytes;
			}
		} else {
			mediaFormat.bytes = (await getStreamBytes(playbackInfo)) ?? this.bytes;
		}

		MediaItem.formatStore.put(mediaFormat).catch(trace.err.withContext("formatStore.put"));
		this.setFormatAttrs(mediaFormat);
	});
	private loadFormat: () => Promise<void> = asyncDebounce(async () => {
		const { value: mediaFormat } = await MediaItem.formatStore.getWithExpiry([+this.id, this.quality.audioQuality]);
		if (mediaFormat) return this.setFormatAttrs(mediaFormat);
		this.updateFormat();
	});

	public readonly bytes?: number;
	public readonly sampleRate?: number;
	public readonly bitDepth?: number;
	public readonly codec?: string;
	public readonly bitrate?: number;

	// Listeners
	private static readonly preloadListeners: Set<MediaItemListener> = new Set();
	public static onPreload(cb: MediaItemListener) {
		this.preloadListeners.add(cb);
		return () => this.preloadListeners.delete(cb);
	}
	private static readonly mediaTransitionListeners: Set<MediaItemListener> = new Set();
	public static onMediaTransition(cb: MediaItemListener) {
		this.mediaTransitionListeners.add(cb);
		return () => this.mediaTransitionListeners.delete(cb);
	}
	private static readonly preMediaTransitionListeners: Set<MediaItemListener> = new Set();
	/** Warning! Not always called, dont rely on this over onMediaTransition */
	public static onPreMediaTransition(cb: MediaItemListener) {
		this.preMediaTransitionListeners.add(cb);
		return () => this.preMediaTransitionListeners.delete(cb);
	}
	private static readonly onFormatUpdateListeners: Set<MediaItemListener> = new Set();
	public static onFormatUpdate(cb: MediaItemListener) {
		this.onFormatUpdateListeners.add(cb);
		return () => this.onFormatUpdateListeners.delete(cb);
	}

	public static useTags: boolean = false;
	public static useMax: boolean = false;
	public static useFormat: boolean = false;

	private preload() {
		if (MediaItem.useTags) this.flacTags();
		if (MediaItem.useMax) this.max();
		if (MediaItem.useFormat) this.loadFormat();
	}

	static {
		// Override readonly
		(this.formatStore as any) = new SharedObjectStoreExpirable("TrackInfoCache", {
			storeSchema: {
				keyPath: ["trackId", "audioQuality"],
			},
			maxAge: 24 * 6 * 60 * 1000,
		});

		// NOTE: Intercept calls will never be unloaded here as this is a global shared object.
		// To reload this class you must restart the client
		intercept(
			// @ts-expect-error Neptune doesn't type this action
			"player/PRELOAD_ITEM",
			([item]: [{ productId?: string; productType?: "track" | "video" }]) => {
				if (item.productId === undefined) return trace.warn("player/PRELOAD_ITEM intercepted without productId!", item);
				this.fromId(item.productId, item.productType).then((mediaItem) => {
					if (mediaItem === undefined) return;
					mediaItem.preload();
					runListeners(mediaItem, this.preloadListeners, trace.err.withContext("preloadItem.runListeners"));
				});
			}
		);

		const _onMediaTransition = asyncDebounce(async (playbackContext: PlaybackContext) => {
			const mediaItem = await this.fromPlaybackContext(playbackContext);
			if (mediaItem === undefined) return;
			// Always update format info on playback
			if (this.useFormat) mediaItem.updateFormat();
			await runListeners(mediaItem, this.mediaTransitionListeners, trace.err.withContext("mediaProductTransition.runListeners"));
		});
		intercept("playbackControls/MEDIA_PRODUCT_TRANSITION", ([{ playbackContext }]) => {
			_onMediaTransition(playbackContext as PlaybackContext);
		});

		const _onPreMediaTransition = asyncDebounce(async (productId: ItemId, productType: MediaItemType) => {
			const mediaItem = await this.fromId(productId, productType);
			if (mediaItem === undefined) return;
			mediaItem.preload();
			await runListeners(mediaItem, this.preMediaTransitionListeners, trace.err.withContext("prefillMPT.runListeners"));
		});
		intercept("playbackControls/PREFILL_MEDIA_PRODUCT_TRANSITION", ([{ mediaProduct }]) => {
			const { productId, productType } = mediaProduct as { productId: ItemId; productType: MediaItemType };
			_onPreMediaTransition(productId, productType);
		});
	}
}
