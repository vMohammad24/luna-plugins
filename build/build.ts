import { context, type BuildOptions } from "esbuild";

import { readdir, readFile } from "fs/promises";
import path from "path";

import { fileUrlPlugin } from "./plugins/fileUrl";
import { writeNeptunePlugin, type PluginPackage } from "./plugins/lib/writeNeptunePlugin";
import { neptuneNativePlugin } from "./plugins/native";
import { neptuneOutput } from "./plugins/neptuneOutput";
import { tritonOutput } from "./plugins/tritonOutput";
import { buildThemes } from "./themes";

export const buildOps: BuildOptions = { minifyIdentifiers: true, minifySyntax: true, minifyWhitespace: true };

buildThemes();

const migrateToTriton = await readFile("./build/migrateToTriton.js");
// TODO: Put all original plugins here for migration
for (const depricated of []) {
	await writeNeptunePlugin(
		{
			path: path.join("./dist", depricated, "index.js"),
			contents: migrateToTriton,
			hash: Math.random().toString(),
		},
		{}
	);
}

// Build Triton modules
const tritonModulesDir = "./plugins/Triton/modules";
const tritonModules = await readdir(tritonModulesDir);
tritonModules.map(async (moduleName) => {
	const ctx = await context({
		entryPoints: ["./" + path.join(tritonModulesDir, moduleName, "src/index.js")],
		plugins: [fileUrlPlugin, neptuneNativePlugin, tritonOutput(moduleName)],
		bundle: true,
		write: false,
		format: "esm",
		// Triton plugins will use @triton/lib off window, which is set by Triton
		external: ["@neptune", "@plugin", "electron", "@triton/lib"],
		platform: "browser",
		outfile: `./dist/tritonModules/${moduleName}.js`,
		...buildOps,
	});
	ctx.watch();
});

// Build Neptune plugins
const neptunePluginsDir = "./plugins";
const neptunePlugins = await readdir(neptunePluginsDir);
neptunePlugins.map(async (pluginName) => {
	const pluginPackage: PluginPackage = await readFile(path.join(neptunePluginsDir, pluginName, "package.json"), "utf8").then(JSON.parse);
	const ctx = await context({
		entryPoints: ["./" + path.join(neptunePluginsDir, pluginName, pluginPackage.main ?? "index.js")],
		plugins: [fileUrlPlugin, neptuneNativePlugin, neptuneOutput(pluginPackage)],
		bundle: true,
		write: false,
		format: "esm",
		external: ["@neptune", "@plugin", "electron"],
		platform: "browser",
		outfile: path.join("./dist", pluginName, "index.js"),
		...buildOps,
	});
	ctx.watch();
});
