import type { Readable } from "stream";
import { FetchyOptions, rejectNotOk, parseTotal } from "./helpers.native";
import { requestStream } from "./requestStream.native";

import { Transform } from "stream";
import { makeDecipher } from "./decrypt.native";

export const requestDecodedStream = async (url: string, options?: FetchyOptions): Promise<Readable> =>
	new Promise(async (resolve, reject) => {
		const { onProgress, bytesWanted, manifest } = options ?? {};
		const reqOptions = { ...(options?.requestOptions ?? {}) };
		if (bytesWanted !== undefined) {
			reqOptions.headers ??= {};
			reqOptions.headers.Range = `bytes=0-${bytesWanted}`;
		}

		const res = await requestStream(url, reqOptions).then(rejectNotOk);

		res.on("error", reject);

		let downloaded = 0;
		const total = parseTotal(res.headers);
		if (total !== -1) onProgress?.({ total, downloaded, percent: (downloaded / total) * 100 });

		const decipher = manifest ? makeDecipher(manifest) : undefined;
		if (decipher !== undefined) {
			resolve(
				res.pipe(
					new Transform({
						async transform(chunk, _, callback) {
							try {
								downloaded += chunk.length;
								onProgress?.({ total, downloaded, percent: (downloaded / total) * 100 });
								callback(null, decipher.update(chunk));
							} catch (err) {
								callback(<Error>err);
							}
						},
						async flush(callback) {
							try {
								callback(null, decipher.final());
							} catch (err) {
								callback(<Error>err);
							}
						},
					})
				)
			);
		}
		resolve(res);
	});
