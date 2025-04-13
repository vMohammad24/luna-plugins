import { getStorage, Signal, Tracer, type Unload } from "@triton/lib";
import { startReduxLog, stopReduxLog } from "./interceptActions";
import { startNativeIPCLog, stopNativeIPCLog } from "./ipc";
import { startRenderIpcLog, stopRenderIpcLog } from "./ipc.native";

export const errSignal = new Signal<string | undefined>(undefined);
export const trace = Tracer("[DevTools]", errSignal);

export const unloads = new Set<Unload>();
unloads.add(stopNativeIPCLog);
unloads.add(stopRenderIpcLog);
unloads.add(stopReduxLog);

export const storage = getStorage("CoverTheme", {
	logIPCFromNative: false,
	logIPCFromRender: false,
	logReduxEvents: false,
	logInterceptsRegex: ".*",
});

if (storage.logIPCFromNative) startNativeIPCLog().catch(trace.err.withContext("Failed to start native IPC logging").throw);
if (storage.logIPCFromRender) startRenderIpcLog().catch(trace.err.withContext("Failed to start render IPC logging").throw);
if (storage.logReduxEvents)
	startReduxLog(new RegExp(storage.logInterceptsRegex || ".*"), trace.log.withContext("(Redux)")).catch(
		trace.err.withContext("Failed to start redux event logging").throw
	);

export { Settings } from "./Settings";
