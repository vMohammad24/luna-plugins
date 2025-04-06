import { Tracer } from "../helpers/trace";
const trace = Tracer("[lib.requestJsonCached]");

import { requestJson, type ExtendedRequestOptions } from "@inrixia/lib.native";

const requestCache: Record<string, Promise<unknown>> = {};
export const requestJsonCached = async <T>(url: string, options?: ExtendedRequestOptions): Promise<T> => {
	const _cachedRes = requestCache[url];
	if (_cachedRes !== undefined) {
		trace.debug("[CACHE HIT]", url);
		return <T>_cachedRes;
	}
	return (requestCache[url] = requestJson<T>(url, options));
};
