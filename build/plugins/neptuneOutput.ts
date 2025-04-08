import type { Plugin } from "esbuild";
import { type PluginPackage, writeNeptunePlugin } from "./lib/writeNeptunePlugin";

export const neptuneOutput = (pluginPackage: PluginPackage): Plugin => ({
	name: "neptuneOutput",
	setup(build) {
		build.onEnd(async (result) => {
			if (result.errors.length > 0) throw new Error(JSON.stringify(result.errors));
			const outputFile = result.outputFiles?.[0]!;

			await writeNeptunePlugin(outputFile, pluginPackage);

			const fileSizeInBytes = outputFile.contents.byteLength;
			const kB = 1024;
			const showInkB = fileSizeInBytes < kB * kB; // 1 MB in bytes
			const fileSizeDisp = showInkB ? `${(fileSizeInBytes / kB).toFixed(2)}kB` : `${(fileSizeInBytes / (kB * kB)).toFixed(2)}mB`;

			console.log(`Built [${outputFile.hash}] ${fileSizeDisp} ${pluginPackage.displayName}!`);
		});
	},
});
