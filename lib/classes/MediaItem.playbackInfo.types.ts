import type { TrackItem } from "neptune-types/tidal";
import type { DashManifest } from "../native/dasha.native";

export enum ManifestMimeType {
	Tidal = "application/vnd.tidal.bts",
	Dash = "application/dash+xml",
}
export type PlaybackInfoResponse = {
	trackId: number;
	assetPresentation: string;
	audioMode: NonNullable<TrackItem["audioModes"]>;
	audioQuality: NonNullable<TrackItem["audioQuality"]>;
	manifestMimeType: ManifestMimeType;
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

interface PlaybackInfoBase extends Omit<PlaybackInfoResponse, "manifestMimeType" | "manifest"> {
	mimeType: string;
}
interface DashPlaybackInfo extends PlaybackInfoBase {
	manifestMimeType: ManifestMimeType.Dash;
	manifest: DashManifest;
}
interface TidalPlaybackInfo extends PlaybackInfoBase {
	manifestMimeType: ManifestMimeType.Tidal;
	manifest: TidalManifest;
}
export type PlaybackInfo = DashPlaybackInfo | TidalPlaybackInfo;
