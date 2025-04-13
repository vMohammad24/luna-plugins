import { actions, store } from "@neptune";
import type { Unload } from "@triton/lib";

import { storage } from "./Settings";

const interval = setInterval(() => {
	const { player, settings } = store.getState();

	// Player specific settings
	// @ts-expect-error Bad Neptune types
	if (storage.exclusiveMode && player.activeDeviceMode === "shared") {
		// @ts-expect-error Bad Neptune types
		actions.player.setDeviceMode("exclusive");
	}
	// @ts-expect-error Bad Neptune types
	const playerForceVolume = player.forceVolume[player.activeDeviceId];
	if (storage.forceVolume !== !!playerForceVolume) {
		// @ts-expect-error Bad Neptune types
		actions.player.setForceVolume({ deviceId: player.activeDeviceId, on: storage.forceVolume });
	}

	// General settings
	if (storage.autoplay !== settings.autoPlay) {
		actions.settings.toggleAutoplay();
	}
	if (storage.normalizeVolume !== (settings.audioNormalization !== "NONE")) {
		actions.settings.toggleNormalization();
	}
	if (storage.explicitContent !== settings.explicitContentEnabled) {
		actions.settings.setExplicitContentToggle({ isEnabled: storage.explicitContent });
	}
}, 1000);

export { Settings } from "./Settings";
export const unloads = new Set<Unload>();
unloads.add(() => clearInterval(interval));
