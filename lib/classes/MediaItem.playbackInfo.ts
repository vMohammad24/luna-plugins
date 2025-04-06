import { Tracer } from "../helpers/trace";
const trace = Tracer("[lib.getPlaybackInfo]");

import { memoize } from "@inrixia/helpers";
import { parseDasha } from "@inrixia/lib.native";
import { findModuleFunction } from "../helpers/findModuleFunction";

import type { MediaItem } from "./MediaItem";
import { PlaybackInfo, PlaybackInfoResponse, TidalManifest } from "./MediaItem.playbackInfo.types";

const getCredentials = memoize(() => {
	const getCredentials = findModuleFunction<() => Promise<{ token: string; clientId: string }>>("getCredentials", "function");
	if (getCredentials === undefined) {
		trace.msg.err("getCredentials func not found...");
		throw new Error("getCredentials func not found");
	}
	return getCredentials;
});

export const getPlaybackInfo = async (mediaItem: MediaItem): Promise<PlaybackInfo> => {
	try {
		const url = `https://desktop.tidal.com/v1/tracks/${mediaItem.id}/playbackinfo?audioquality=${mediaItem.quality.audioQuality}&playbackmode=STREAM&assetpresentation=FULL`;

		const { clientId, token } = await getCredentials()();
		const playbackInfo: PlaybackInfoResponse = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				"x-tidal-token": clientId,
			},
		}).then((r) => {
			if (r.status === 401) {
				trace.err("fetchPlaybackIinfo", "Invalid OAuth Access Token!");
				throw new Error("Invalid OAuth Access Token!");
			}
			return r.json();
		});

		switch (playbackInfo.manifestMimeType) {
			case "application/vnd.tidal.bts": {
				const manifest: TidalManifest = JSON.parse(atob(playbackInfo.manifest));
				return { ...playbackInfo, manifestMimeType: playbackInfo.manifestMimeType, manifest, mimeType: manifest.mimeType };
			}
			case "application/dash+xml": {
				const manifest = await parseDasha(atob(playbackInfo.manifest), "https://sp-ad-cf.audio.tidal.com");
				return { ...playbackInfo, manifestMimeType: playbackInfo.manifestMimeType, manifest, mimeType: "audio/mp4" };
			}
			default: {
				throw new Error(`Unsupported Stream Info manifest mime type: ${playbackInfo.manifestMimeType}`);
			}
		}
	} catch (e) {
		throw new Error(`Failed to get playbackInfo! ${(<Error>e)?.message}`);
	}
};
