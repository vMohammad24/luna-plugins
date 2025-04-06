import type { UnknownRecord } from "@inrixia/helpers";

// @ts-expect-error modules has changed to moduleCache
import { moduleCache } from "@neptune";

export const findModuleFunction = <T>(propertyName: string, propertyType: string): T | undefined => recursiveSearch<T>(moduleCache, propertyName, propertyType);

// @ts-expect-error
window.findModuleFunction = findModuleFunction;

const recursiveSearch = <T>(obj: UnknownRecord, propertyName: string, propertyType: string, seen = new Set<UnknownRecord>()): T | undefined => {
	if (seen.has(obj)) return;
	seen.add(obj);
	for (const key of getKeys(obj)) {
		try {
			const prop = obj[key];
			if (typeof prop === "object" && prop !== null) {
				const found = recursiveSearch<T>(<UnknownRecord>prop, propertyName, propertyType, seen);
				if (found !== undefined) return found;
			}
			if (key === propertyName && typeof prop === propertyType) return <T>prop;
		} catch {}
	}
};

const getKeys = (obj: UnknownRecord) => {
	const keys = Object.keys(obj);
	if (keys.length !== 0) return keys;
	return Reflect.ownKeys(Object.getPrototypeOf(obj) ?? obj);
};
