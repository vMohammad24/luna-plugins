import type { AnyRecord } from "@inrixia/helpers";
import { storage } from "@plugin";

export const getStorage = <T extends AnyRecord>(name: string, defaultValue: T): T => {
	storage[name] ??= {};
	for (const key of Object.keys(defaultValue)) {
		(<AnyRecord>storage[name])[key] ??= defaultValue[key];
	}
	return <T>storage[name];
};
