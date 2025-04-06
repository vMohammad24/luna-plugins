import { requestDecodedStream } from "./requestDecodedStream.native";
import { requestSegmentsStream } from "./requestSegmentsStream.native";

import type { Readable } from "stream";
import type { FetchyOptions } from "./helpers.native";

import { ManifestMimeType, type PlaybackInfo } from "../../classes/MediaItem.playbackInfo.types";

export type ExtendedPlaybackInfoWithBytes = PlaybackInfo & { stream: Readable };
export const requestTrackStream = async ({ manifestMimeType, manifest }: PlaybackInfo, fetchyOptions: FetchyOptions = {}): Promise<Readable> => {
	switch (manifestMimeType) {
		case ManifestMimeType.Tidal: {
			return requestDecodedStream(manifest.urls[0], { ...fetchyOptions, manifest });
		}
		case ManifestMimeType.Dash: {
			const trackManifest = manifest.tracks.audios[0];
			return requestSegmentsStream(
				trackManifest.segments.map((segment) => segment.url),
				fetchyOptions
			);
		}
		default: {
			throw new Error(`Unsupported Stream Info manifest mime type: ${manifestMimeType}`);
		}
	}
};
