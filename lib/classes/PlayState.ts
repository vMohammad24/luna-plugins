import { Tracer } from "../helpers/trace";
const trace = Tracer("[lib.PlayState]");

import { intercept } from "@neptune";

import type { MediaItemListener } from "./MediaItem";
import MediaItem, { runListeners } from "./MediaItem";

import type { CoreState, TrackItem } from "neptune-types/tidal";
import type { MediaItemAudioQuality } from "../classes/Quality";

export type PlaybackContext = {
	actualAssetPresentation: string;
	actualAudioMode: TrackItem["audioModes"];
	actualAudioQuality: MediaItemAudioQuality;
	actualDuration: number;
	actualProductId: string;
	actualStreamType: unknown;
	actualVideoQuality: unknown;
	assetPosition: number;
	bitDepth: number | null;
	codec: string;
	playbackSessionId: string;
	sampleRate: number | null;
};

type PlaybackControl = CoreState["playbackControls"] & { playbackContext: PlaybackContext };

class PlayState {
	public static readonly MIN_SCROBBLE_DURATION = 240000; // 4 minutes in milliseconds
	public static readonly MIN_SCROBBLE_PERCENTAGE = 0.5; // Minimum percentage of song duration required to scrobble
	public static trackPlayTime: number = 0;
	public static lastPlayStart?: number;

	public static get playbackControls(): PlaybackControl {
		return neptune.store.getState().playbackControls as PlaybackControl;
	}

	public static get playbackContext(): PlaybackContext {
		return this.playbackControls.playbackContext;
	}

	public static get state() {
		return this.playbackControls.playbackState;
	}
	public static get desiredState() {
		return this.playbackControls.desiredPlaybackState;
	}

	public static get paused(): boolean {
		return this.desiredState !== "PLAYING";
	}

	public static get latestCurrentTime() {
		return this.playbackControls.latestCurrentTime;
	}

	static {
		// Ensure that if we are inside a dead object that we do nothing.
		// If this is called with window.Estr.MediaItem defined we are going to export that instead.
		if (window.Estr?.PlayState === undefined) {
			intercept("playbackControls/SET_PLAYBACK_STATE", ([state]) => {
				switch (state) {
					case "PLAYING": {
						this.lastPlayStart = Date.now();
						break;
					}
					default: {
						if (this.lastPlayStart !== undefined) this.trackPlayTime += Date.now() - this.lastPlayStart;
						delete this.lastPlayStart;
					}
				}
			});
			MediaItem.onMediaTransition((mediaItem) => {
				if (mediaItem.duration === undefined) return;
				if (this.lastPlayStart !== undefined) this.trackPlayTime += Date.now() - this.lastPlayStart;
				const longerThan4min = this.trackPlayTime >= this.MIN_SCROBBLE_DURATION;
				const minPlayTime = mediaItem.duration * this.MIN_SCROBBLE_PERCENTAGE * 1000;
				const moreThan50Percent = this.trackPlayTime >= minPlayTime;
				if (longerThan4min || moreThan50Percent) runListeners(mediaItem, this.onScrobbleListeners, trace.err.withContext("onScrobble"));

				// reset as we started playing a new one
				this.trackPlayTime = 0;
			});
		}
	}

	private static readonly onScrobbleListeners: Set<MediaItemListener> = new Set();
	public static onScrobble(cb: MediaItemListener) {
		this.onScrobbleListeners.add(cb);
		return () => this.onScrobbleListeners.delete(cb);
	}
}

// @ts-expect-error Ensure window.Estr is prepped
window.Estr ??= {};
// @ts-expect-error Always use the shared class
PlayState = window.Estr.PlayState ??= PlayState;
export default PlayState;
