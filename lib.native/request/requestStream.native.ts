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
			const statusMsg = res.statusMessage !== "" ? ` - ${res.statusMessage}` : "";
			if (res.statusCode === 429 || res.statusCode === 503) {
				const retryAfter = parseInt(res.headers["retry-after"] ?? "1", 10);
				options.rateLimit!++;
				trace.debug(`[${res.statusCode}${statusMsg}] (${req.method} - ${Date.now() - start}ms)`, `[Attempt ${options.rateLimit}, Retry in ${retryAfter}s]`, url);
				return setTimeout(() => {
					release?.();
					requestStream(url, options).then(resolve, reject);
				}, retryAfter * 1000);
			}
			if (options.rateLimit! > 0) trace.debug(`[${res.statusCode}${statusMsg}] (${req.method} - ${Date.now() - start}ms)`, `[After ${options.rateLimit} attempts]`, url);
			else trace.debug(`[${res.statusCode}${statusMsg}] (${req.method} - ${Date.now() - start}ms)`, url);
			resolve(res);
		});
		req.on("error", reject);

		if (body !== undefined) req.write(body);
		req.end();
	}).finally(release);
};
