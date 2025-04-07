import CleanCSS from "clean-css";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const buildThemes = async () => {
	await mkdir("./dist/themes", { recursive: true });
	const themes = await readdir("./themes");
	themes.map(async (themePath) => {
		const file = await readFile(path.join("./themes", themePath), "utf8");
		const css = new CleanCSS().minify(file).styles;

		// Minify manifest JSON
		const json = file.slice(file.indexOf("/*") + 2, file.indexOf("*/"));
		const manifest = JSON.parse(json);
		const comment = `/*${JSON.stringify(manifest)}*/`;

		await writeFile(path.join("./dist/themes", themePath), comment + css);
		console.log(`[Theme] ${manifest.name} built!`);
	});
};
