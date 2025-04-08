import type { Plugin } from "esbuild";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";

export const tritonOutput = (moduleName: string): Plugin => ({
	name: "tritonOutput",
	setup(build) {
		build.onEnd(async (result) => {
			if (result.errors.length > 0) throw new Error(JSON.stringify(result.errors));
			const outputFile = result.outputFiles?.[0]!;

			const outDir = dirname(outputFile.path);
			await mkdir(outDir, { recursive: true });
			await Promise.all([writeFile(outputFile.path, outputFile.contents), writeFile(join(outDir, `${moduleName}.hash`), outputFile.hash)]);

			const fileSizeInBytes = outputFile.contents.byteLength;
			const kB = 1024;
			const showInkB = fileSizeInBytes < kB * kB; // 1 MB in bytes
			const fileSizeDisp = showInkB ? `${(fileSizeInBytes / kB).toFixed(2)}kB` : `${(fileSizeInBytes / (kB * kB)).toFixed(2)}mB`;

			console.log(`Built [${outputFile.hash}] ${fileSizeDisp} Triton.${moduleName}!`);
		});
	},
});
