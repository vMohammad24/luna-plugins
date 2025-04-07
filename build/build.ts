import { context, Plugin } from "esbuild";

import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { fileUrl } from "./fileUrl";
import { neptuneNativeImports } from "./native";
import { buildThemes } from "./themes";

const minify = true;

buildThemes();

const pluginsRoot = "./plugins/";

type PluginPackage = {
	displayName?: string;
	description?: string;
	author?: string;
	main?: string;
};
const neptuneOutput = (pluginPackage: PluginPackage): Plugin => ({
	name: "neptuneManifest",
	setup(build) {
		build.onEnd(async (result) => {
			if (result.errors.length > 0) throw new Error(JSON.stringify(result.errors));
			const outputFile = result.outputFiles?.[0]!;
			const outDir = path.dirname(outputFile.path);
			await mkdir(outDir, { recursive: true });
			await Promise.all([
				writeFile(outputFile.path, outputFile.contents),
				writeFile(
					path.join(outDir, "manifest.json"),
					JSON.stringify({
						name: pluginPackage.displayName ?? "",
						description: pluginPackage.description ?? "",
						author: pluginPackage.author ?? "",
						hash: outputFile.hash,
					})
				),
			]);
			console.log(`[Plugin] ${pluginPackage.displayName} built!`);
		});
	},
});

const plugins = await readdir(pluginsRoot);
plugins.map(async (plugin) => {
	const pluginPackage = await readFile(path.join(pluginsRoot, plugin, "package.json"), "utf8").then(JSON.parse);

	const ctx = await context({
		entryPoints: ["./" + path.join(pluginsRoot, plugin, pluginPackage.main ?? "index.js")],
		plugins: [fileUrl, neptuneNativeImports, neptuneOutput(pluginPackage)],
		bundle: true,
		write: false,
		minify,
		format: "esm",
		external: ["@neptune", "@plugin"],
		platform: "browser",
		outfile: path.join("./dist", plugin, "index.js"),
	});

	await ctx.watch();
});
