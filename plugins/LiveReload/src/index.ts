import { pluginStore, reloadPlugin } from "@neptune/plugins";
import type { PluginManifest } from "neptune-types/api/plugins";

let running = true;
while (running) {
	for (const plugin of pluginStore) {
		if (!plugin.enabled) continue;
		try {
			const { hash, name }: PluginManifest = await fetch(`${new URL(plugin.id).href}/manifest.json`).then((res) => res.json());
			if (hash !== plugin.manifest.hash) {
				await reloadPlugin(plugin);
				console.log(`Reloaded ${name}!`);
			}
		} catch {}
	}
	await new Promise((res) => setTimeout(res, 1000));
}

export const onUnload = () => (running = false);
