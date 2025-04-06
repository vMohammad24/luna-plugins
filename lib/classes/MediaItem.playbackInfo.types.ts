import type { DashManifest } from "@inrixia/lib.native";
import type { TrackItem } from "neptune-types/tidal";

export type PlaybackInfoResponse = {
	trackId: number;
	assetPresentation: string;
	audioMode: NonNullable<TrackItem["audioModes"]>;
	audioQuality: NonNullable<TrackItem["audioQuality"]>;
	manifestMimeType: "application/vnd.tidal.bts" | "application/dash+xml";
	manifestHash: string;
	manifest: string;
	albumReplayGain: number;
	albumPeakAmplitude: number;
	trackReplayGain: number;
	trackPeakAmplitude: number;
	bitDepth: number;
	sampleRate: number;
};
export type TidalManifest = {
	mimeType: string;
	codecs: string;
	encryptionType: string;
	keyId: string;
	urls: string[];
};

interface PlaybackInfoBase extends Omit<PlaybackInfoResponse, "manifest"> {
	mimeType: string;
}

interface TidalPlaybackInfo extends PlaybackInfoBase {
	manifestMimeType: "application/vnd.tidal.bts";
	manifest: TidalManifest;
}
interface DashPlaybackInfo extends PlaybackInfoBase {
	manifestMimeType: "application/dash+xml";
	manifest: DashManifest;
}
export type PlaybackInfo = DashPlaybackInfo | TidalPlaybackInfo;
