import { LunaUnload, unloadSet } from "@luna/core";
import { redux } from "@luna/lib";
import { MediaItem, PlayState } from "@luna/unstable";
import { send } from "./remoteService.native";

export * from "./remoteService.native";

export const unloads = new Set<LunaUnload>();

// #region From remote
unloads.add(
	ipcRenderer.on("remote.desktop.notify.media.changed", async ({ mediaId }) => {
		const mediaItem = await MediaItem.fromId(mediaId);
		mediaItem?.play();
		send({ command: "onRequestNextMedia", type: "media" });
	})
);
unloads.add(
	ipcRenderer.on("remote.desktop.prefetch", ({ mediaId, mediaType }) => {
		redux.actions["player/PRELOAD_ITEM"]({ productId: mediaId, productType: mediaType === 0 ? "track" : "video" });
	})
);
unloads.add(ipcRenderer.on("remote.desktop.seek", (time: number) => PlayState.seek(time / 1000)));
unloads.add(ipcRenderer.on("remote.desktop.play", PlayState.play.bind(PlayState)));
unloads.add(ipcRenderer.on("remote.desktop.pause", PlayState.pause.bind(PlayState)));
unloads.add(ipcRenderer.on("remote.desktop.set.shuffle", PlayState.setShuffle.bind(PlayState)));
unloads.add(ipcRenderer.on("remote.desktop.set.repeat.mode", PlayState.setRepeatMode.bind(PlayState)));
unloads.add(
	ipcRenderer.on("remote.destop.set.volume.mute", ({ level, mute }: { level: number; mute: boolean }) => {
		redux.actions["playbackControls/SET_MUTE"](mute);
		redux.actions["playbackControls/SET_VOLUME"]({
			volume: Math.min(level * 100, 100),
		});
	})
);
// #endregion

// #region To remote
// Using send from remoteService.native as its more consistent
const sessionUnloads = new Set<LunaUnload>();
unloads.add(
	ipcRenderer.on("remote.desktop.notify.session.state", (state) => {
		if (state === 0) unloadSet(sessionUnloads);
		if (sessionUnloads.size !== 0) return;
		sessionUnloads.add(
			ipcRenderer.on("client.playback.playersignal", ({ time }: { time: number }) => {
				send({
					command: "onProgressUpdated",
					duration: 0,
					progress: time * 1000,
					type: "media",
				});
			})
		);
		redux.intercept("playbackControls/SET_PLAYBACK_STATE", sessionUnloads, (state) => {
			switch (state) {
				case "IDLE":
					return send({ command: "onStatusUpdated", playerState: "idle", type: "media" });
				case "NOT_PLAYING":
					return send({ command: "onStatusUpdated", playerState: "paused", type: "media" });
				case "PLAYING":
					return send({ command: "onStatusUpdated", playerState: "playing", type: "media" });
				case "STALLED":
					return send({ command: "onStatusUpdated", playerState: "buffering", type: "media" });
			}
		});
		redux.intercept<{ reason: "completed" | "skip" }>("playbackControls/ENDED", sessionUnloads, ({ reason }) => {
			if (reason === "completed") send({ command: "onPlaybackCompleted", hasNextMedia: false, type: "media" });
			return true;
		});
		redux.intercept("playbackControls/SKIP_NEXT", sessionUnloads, () => {
			PlayState.pause();
			send({ command: "onStatusUpdated", playerState: "idle", type: "media" });
			send({ command: "onPlaybackCompleted", hasNextMedia: false, type: "media" });
			return true;
		});
	})
);
unloads.add(() => unloadSet(sessionUnloads));
// #endregion
