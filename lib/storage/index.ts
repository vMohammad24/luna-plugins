import { storage } from "@plugin";

type Storage = Record<any, any> & { settings?: never };
type StorageSettings = Record<any, any>;
export const getStorage = <T extends Storage>(defaultValue: T): T => {
	Object.keys(defaultValue).forEach((key) => (storage[key] ??= defaultValue[key]));
	return <T>storage;
};
export const getSettings = <T extends StorageSettings>(defaultValue: T): T => {
	storage.settings ??= {};
	for (const key of Object.keys(defaultValue)) {
		// @ts-expect-error Typical key indexing issues with JSONValue types
		storage.settings[key] ??= defaultValue[key];
	}
	return <T>storage.settings;
};
