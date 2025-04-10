import { Semaphore } from "@inrixia/helpers";
import { tritonTracer } from ".";

export type Unload = {
	(): Promise<unknown> | unknown;
	source?: string;
};

const unloadSema = new Semaphore(1);
export const unloadSet = async (unloads?: Set<Unload>): Promise<void> => {
	if (unloads === undefined) return;
	// Ensure that we cant unload more than one thing at a time to
	// avoid race conditions or calling a unload twice
	const release = await unloadSema.obtain();
	try {
		const unloading = [];
		for (const unload of unloads) {
			// Unload async to not block
			unloading.push(
				(async () => {
					try {
						await unload();
					} catch (err) {
						tritonTracer.msg.err.withContext(`Error unloading ${unload.source ?? ""} ${unload.name}`)(err);
					}
				})()
			);
		}
		// Clear unloads after called to ensure their never called again
		unloads.clear();
		await Promise.all(unloading);
	} finally {
		release();
	}
};

export const tritonUnloads = new Set<Unload>();
export const onUnload = () => unloadSet(tritonUnloads);
