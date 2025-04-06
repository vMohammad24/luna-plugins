import { requestDecodedStream } from "./requestDecodedStream.native";
import { requestSegmentsStream } from "./requestSegmentsStream.native";

import type { Readable } from "stream";
import type { FetchyOptions } from "./helpers.native";

import { type PlaybackInfo } from "@inrixia/lib";

export type ExtendedPlaybackInfoWithBytes = PlaybackInfo & { stream: Readable };
export const requestTrackStream = async ({ manifestMimeType, manifest }: PlaybackInfo, fetchyOptions: FetchyOptions = {}): Promise<Readable> => {
	switch (manifestMimeType) {
		case "application/vnd.tidal.bts": {
			return requestDecodedStream(manifest.urls[0], { ...fetchyOptions, manifest });
		}
		case "application/dash+xml": {
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
