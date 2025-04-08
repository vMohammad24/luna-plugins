import { pluginStore, reloadPlugin } from "@neptune/plugins";
import type { PluginManifest } from "neptune-types/api/plugins";

const checkPlugins = async () => {
	try {
		for (const plugin of pluginStore) {
			if (!plugin.enabled) continue;

			const { hash, name }: PluginManifest = await fetch(`${new URL(plugin.id).href}/manifest.json`).then((res) => res.json());
			if (hash !== plugin.manifest.hash) {
				await reloadPlugin(plugin);
				console.log(`Reloaded ${name}!`);
			}
		}
	} catch {}
};

const interval = setInterval(checkPlugins, 1000);
export const onUnload = () => clearInterval(interval);
