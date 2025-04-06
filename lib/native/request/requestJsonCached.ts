import { Tracer } from "../../helpers/trace";
const trace = Tracer("[lib.requestJsonCached]");

import { SharedObjectStore } from "../../storage/SharedObjectStore";

import { requestJsonCached as rjcNative } from "./requestJsonCached.native";
import { setDefaultUserAgent } from "./requestStream.native";

setDefaultUserAgent(navigator.userAgent).catch(trace.err.withContext("Failed to set default user agent"));

// Utilize requestCache to persist cache
const requestCache = new SharedObjectStore<string, any>("requestCache");
export const requestJsonCached: typeof rjcNative = async (url, options) => {
	// Always update the shared cache from the live cache, keep cache up to date while returning stale values
	const liveCacheRes = rjcNative(url, options).then((apiRes) => {
		requestCache.put(apiRes, url).catch(trace.err.withContext("requestCache.put", url, options, apiRes));
		return apiRes;
	});
	const fastRes = await Promise.race([liveCacheRes, requestCache.get(url).catch(trace.err.withContext("requestCache.get", url, options))]);
	if (fastRes !== undefined) return fastRes;
	return liveCacheRes;
};
