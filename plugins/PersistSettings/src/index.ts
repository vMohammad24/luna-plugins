import type { LunaUnload } from "@luna/core";
import { redux } from "@luna/lib";

import { storage } from "./Settings";

const interval = setInterval(() => {
	const { player, settings } = redux.store.getState();

	// Player specific settings
	if (storage.exclusiveMode && player.activeDeviceMode === "shared") redux.actions["player/SET_DEVICE_MODE"]("exclusive");

	const playerForceVolume = player.forceVolume[player.activeDeviceId];
	if (storage.forceVolume !== !!playerForceVolume) {
		redux.actions["player/SET_FORCE_VOLUME"]({ deviceId: player.activeDeviceId, on: storage.forceVolume });
	}

	// General settings
	if (storage.autoplay !== settings.autoPlay) redux.actions["settings/TOGGLE_AUTOPLAY"]();
	if (storage.normalizeVolume !== (settings.audioNormalization !== "NONE")) redux.actions["settings/TOGGLE_NORMALIZATION"]();
	if (storage.explicitContent !== settings.explicitContentEnabled) {
		redux.actions["settings/SET_EXPLICIT_CONTENT_TOGGLE"]({ isEnabled: storage.explicitContent });
	}
}, 1000);

export { Settings } from "./Settings";
export const unloads = new Set<LunaUnload>();
unloads.add(() => clearInterval(interval));
