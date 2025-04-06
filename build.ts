import CleanCSS from "clean-css";
import crypto from "crypto";
import esbuild from "esbuild";
import fs from "fs";
import { minify as minifyHtml } from "html-minifier-terser";
import path from "path";

const nativeExternals = ["@neptune", "@plugin", "electron"];
const minify = true;

// Based on Vencord's file-uri-plugin
// https://github.com/Vendicated/Vencord/blob/main/scripts/build/common.mjs
const fileUrl: esbuild.Plugin = {
	name: "fileUrl",
	setup: (build) => {
		const filter = /^file:\/\/.+/;
		build.onResolve({ filter }, (args) => ({
			path: args.path,
			pluginData: {
				uri: args.path,
				path: path.join(args.resolveDir, args.path.slice("file://".length).split("?")[0]),
			},
			namespace: "file-url",
		}));
		build.onLoad({ filter, namespace: "file-url" }, async ({ pluginData: { path, uri } }) => {
			const { searchParams } = new URL(uri);
			const base64 = searchParams.has("base64");
			const minify = searchParams.has("minify");
			const encoding = base64 ? "base64" : "utf-8";

			let content;
			if (!minify) {
				content = fs.readFileSync(path, encoding).trimEnd();
			} else {
				const file = fs.readFileSync(path, "utf-8");
				if (path.endsWith(".html")) {
					content = await minifyHtml(file, {
						collapseWhitespace: true,
						removeComments: true,
						minifyCSS: true,
						minifyJS: true,
						removeEmptyAttributes: true,
						removeRedundantAttributes: true,
						removeScriptTypeAttributes: true,
						removeStyleLinkTypeAttributes: true,
						useShortDoctype: true,
					});
				} else if (path.endsWith(".css")) {
					content = new CleanCSS().minify(file).styles;
				} else {
					throw new Error(`Don't know how to minify file type: ${path}`);
				}

				if (base64) content = Buffer.from(content).toString("base64");
			}

			return {
				contents: `export default ${JSON.stringify(content)}`,
			};
		});
	},
};

const neptuneNativeImports: esbuild.Plugin = {
	name: "neptuneNativeImports",
	setup(build) {
		build.onLoad({ filter: /.*\.native\.[a-z]+/ }, async (args) => {
			const globalName = "neptuneExports";
			const result = await esbuild.build({
				entryPoints: [args.path],
				bundle: true,
				minify,
				treeShaking: true,
				platform: "node",
				format: "iife",
				globalName,
				write: false,
				external: nativeExternals,
				plugins: [fileUrl],
			});

			const outputCode = result.outputFiles[0].text;

			// HATE! WHY WHY WHY WHY WHY (globalName breaks metafile. crying emoji)
			const { metafile } = await esbuild.build({
				entryPoints: [args.path],
				platform: "node",
				write: false,
				metafile: true,
				bundle: true,
				// This breaks native calls via neptune api but we dont use those
				minify,
				treeShaking: true,
				format: "esm",
				external: nativeExternals,
				plugins: [fileUrl],
			});

			const output = Object.values(metafile.outputs)[0];

			const entryPoint = output.entryPoint?.replace("plugins/", "");

			const registerExports = `__${entryPoint}_registerExports`;
			const invokeExport = `__${entryPoint}`;

			return {
				contents: `
					// Ensure eval exposed
					const scopeId = NeptuneNative.createEvalScope(${JSON.stringify(`
						electron.ipcMain.removeHandler("${registerExports}");
						electron.ipcMain.handle("${registerExports}", (_, code, globalName) => {
							const exports = eval(\`(() => {\${code};return \${globalName};})()\`)
							electron.ipcMain.removeHandler("${invokeExport}");
							electron.ipcMain.handle("${invokeExport}", (_, exportName, ...args) => exports[exportName](...args));
						});
					`)});
					// We dont need to persist the eval scope its bound to ipcMain.handle listener
					NeptuneNative.deleteEvalScope(scopeId);

					// Register the native code
					await window.electron.ipcRenderer.invoke("${registerExports}", ${JSON.stringify(outputCode)}, "${globalName}");
				
					// Helper function for invoking exports
					const invokeNative = (exportName) => (...args) => window.electron.ipcRenderer.invoke("${invokeExport}", exportName, ...args).catch((err) => {
						const msg = err.stack?.replaceAll("Error invoking remote method '${invokeExport}': Error: ", "");
						throw new Error(\`[${entryPoint}.\${exportName}] \${msg}\`);
					});

					// Expose built exports via ipc
					${output.exports.reduce((exports, _export) => {
						const exportName = _export == "default" ? "default " : `const ${_export}`;
						return (exports += `export ${exportName} = invokeNative("${_export}");`);
					}, "")}
				`,
			};
		});
	},
};

const plugins = fs.readdirSync("./plugins");
for (const plugin of plugins) {
	const pluginPath = path.join("./plugins/", plugin);
	const pluginPackage = JSON.parse(fs.readFileSync(path.join(pluginPath, "package.json"), "utf8"));
	const outfile = path.join("./dist", plugin, "index.js");

	esbuild
		.build({
			entryPoints: ["./" + path.join(pluginPath, pluginPackage.main ?? "index.js")],
			plugins: [fileUrl, neptuneNativeImports],
			bundle: true,
			minify,
			format: "esm",
			external: ["@neptune", "@plugin"],
			platform: "browser",
			outfile,
		})
		.then(() => {
			fs
				.createReadStream(outfile)
				// It being md5 does not matter, this is for caching and not security
				.pipe(crypto.createHash("md5").setEncoding("hex"))
				.on("finish", function (this: crypto.Hash) {
					fs.writeFileSync(
						path.join("./dist", plugin, "manifest.json"),
						JSON.stringify({
							name: pluginPackage.displayName,
							description: pluginPackage.description,
							author: pluginPackage.author,
							hash: this.read(),
						})
					);

					console.log("Built " + pluginPackage.displayName + "!");
				});
		});
}

fs.mkdirSync("./dist/themes", { recursive: true });
const themes = fs.readdirSync("./themes");
for (const theme of themes) {
	const file = fs.readFileSync(path.join("./themes", theme), "utf8");
	const css = new CleanCSS().minify(file).styles;

	// Minify manifest JSON
	const json = file.slice(file.indexOf("/*") + 2, file.indexOf("*/"));
	const manifest = JSON.parse(json);
	const comment = `/*${JSON.stringify(manifest)}*/`;

	fs.writeFileSync(path.join("./dist/themes", theme), comment + css);
	console.log("Built " + manifest.name + "!");
}
