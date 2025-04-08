import { Tracer, unloads, type Unload } from "../lib/src";
const tritonTracer = Tracer("[Triton]");

export const unloadIt = async (unload: Unload) => {
	try {
		await unload();
		unloads.delete(unload);
	} catch (err) {
		tritonTracer.err.withContext(`Error unloading ${unload.source ?? unload.name}`)(err);
	}
};
export const onUnload = () => unloads.forEach(unloadIt);

export { Settings } from "./TritonSettings";
