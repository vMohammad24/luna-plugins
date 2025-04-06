import { Tracer } from "../helpers/trace.native";
const trace = Tracer("[lib.native.requestStream]");

import { Semaphore } from "@inrixia/helpers";
import type { IncomingMessage } from "http";
import { RequestOptions, request } from "https";

let defaultUserAgent: string = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) TIDAL/9999.9999.9999 Chrome/126.0.6478.127 Electron/31.2.1 Safari/537.36";
export const setDefaultUserAgent = async (userAgent: string) => (defaultUserAgent = userAgent);

// Cap to two requests per domain at a time
const rateLimitSema = new Semaphore(1);
export type ExtendedRequestOptions = RequestOptions & { body?: string; rateLimit?: number };
export const requestStream = async (url: string, options: ExtendedRequestOptions = {}): Promise<IncomingMessage> => {
	const start = Date.now();
	options.headers ??= {};
	options.headers["user-agent"] = defaultUserAgent;
	options.rateLimit ??= 0;
	const release = options.rateLimit > 0 ? await rateLimitSema.obtain() : undefined;
	return new Promise<IncomingMessage>((resolve, reject) => {
		const body = options.body;
		delete options.body;
		if (body !== undefined) {
			options.headers ??= {};
			options.headers["Content-Length"] = Buffer.byteLength(body);
		}
		const req = request(url, options, (res) => {
			res.url = url;
			const debugStatus = `[${req.method} ${res.statusCode} ${res.statusMessage !== "" ? `- ${res.statusMessage}` : ""} in ${Date.now() - start}ms]`;
			if (res.statusCode === 429 || res.statusCode === 503) {
				const retryAfter = parseInt(res.headers["retry-after"] ?? "1", 10);
				options.rateLimit!++;
				trace.debug(debugStatus, `[Attempt ${options.rateLimit}, Retry in ${retryAfter}s]`, url, options);
				return setTimeout(() => {
					release?.();
					requestStream(url, options).then(resolve, reject);
				}, retryAfter * 1000);
			}
			if (options.rateLimit! > 0) trace.debug(debugStatus, `[After ${options.rateLimit} attempts]`, url, options);
			else trace.debug(debugStatus, url, options);
			resolve(res);
		});
		req.on("error", reject);

		if (body !== undefined) req.write(body);
		req.end();
	}).finally(release);
};
