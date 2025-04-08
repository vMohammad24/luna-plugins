import type { OutputFile } from "esbuild";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";

export type PluginPackage = {
	displayName?: string;
	description?: string;
	author?: string;
	main?: string;
};
export const writeNeptunePlugin = async (outputFile: Omit<OutputFile, "text">, pluginPackage: PluginPackage) => {
	const outDir = dirname(outputFile.path);
	await mkdir(outDir, { recursive: true });
	await Promise.all([
		writeFile(outputFile.path, outputFile.contents),
		writeFile(
			join(outDir, "manifest.json"),
			JSON.stringify({
				name: pluginPackage.displayName ?? "",
				description: pluginPackage.description ?? "",
				author: pluginPackage.author ?? "",
				hash: outputFile.hash,
			})
		),
	]);
};
