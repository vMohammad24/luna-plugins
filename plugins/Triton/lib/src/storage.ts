import type { AnyRecord } from "@inrixia/helpers";
import { storage } from "@plugin";

export const getStorage = <T extends AnyRecord>(name: string, defaultValue: T): T => setDefaults<T>(<AnyRecord>(storage[name] ??= {}), defaultValue);
export const setDefaults = <T extends AnyRecord>(obj: AnyRecord, defaultValue: T) => {
	for (const key of Object.keys(defaultValue)) {
		obj[key] ??= defaultValue[key];
	}
	return <T>obj;
};
