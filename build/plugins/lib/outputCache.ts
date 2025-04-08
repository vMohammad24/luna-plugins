import { stat } from "fs/promises";

import { memoize } from "@inrixia/helpers";
import { OnLoadArgs, OnLoadResult } from "esbuild";

type BuildFunc = (args: OnLoadArgs, mtimeMs: number, size: number) => OnLoadResult | null | undefined | Promise<OnLoadResult | null | undefined>;
export const buildCache = (build: BuildFunc) => {
	const _build = memoize(build);
	return async (args: OnLoadArgs) => {
		// Include mtimeMs and size in build call so its memoized
		const { mtimeMs, size } = await stat(args.pluginData?.path ?? args.path);
		return _build(args, mtimeMs, size);
	};
};
