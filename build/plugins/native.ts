import { build, Plugin } from "esbuild";
import { fileUrlPlugin } from "./fileUrl";
import { buildCache } from "./lib/outputCache";

import { minify } from "../build";

const nativeExternals = ["electron"];

const buildOutput = buildCache(async (args) => {
	const globalName = "neptuneExports";

	const [{ outputFiles }, { metafile }] = await Promise.all([
		build({
			entryPoints: [args.path],
			write: false,
			metafile: false,
			bundle: true,
			minify,
			treeShaking: true,
			platform: "node",
			format: "iife",
			globalName,
			external: nativeExternals,
			plugins: [fileUrlPlugin],
		}),
		// Have to build twice to generate metafile as globalName breaks metafile generation
		build({
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
			plugins: [fileUrlPlugin],
		}),
	]);

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
		await window.electron.ipcRenderer.invoke("${registerExports}", ${JSON.stringify(outputFiles[0].text)}, "${globalName}");
	
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
export const neptuneNativePlugin: Plugin = {
	name: "neptuneNativeImports",
	setup(build) {
		build.onLoad({ filter: /.*\.native\.[a-z]+/ }, buildOutput);
	},
};
