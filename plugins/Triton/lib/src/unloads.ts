import { tritonTracer } from ".";

export type Unload = {
	(): Promise<unknown> | unknown;
	source?: string;
};

export const tritonUnloads = new Set<Unload>();
export const unloadIt = async (unload: Unload) => {
	try {
		await unload();
		tritonUnloads.delete(unload);
	} catch (err) {
		tritonTracer.err.withContext(`Error unloading ${unload.source ?? ""} ${unload.name}`)(err);
	}
};
export const onUnload = () => tritonUnloads.forEach(unloadIt);
