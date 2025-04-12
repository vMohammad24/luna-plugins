import {
	getStorage,
	React,
	Signal,
	Tracer,
	TritonButtonSetting,
	TritonSetting,
	TritonSettings,
	TritonSwitch,
	TritonSwitchSetting,
	TritonText,
	TritonTitle,
	type Unload,
} from "@triton/lib";
import { startNativeDebugging } from "./debug.native";
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
	startReduxLog(new RegExp(storage.logInterceptsRegex), trace.log.withContext("(Redux)")).catch(
		trace.err.withContext("Failed to start redux event logging").throw
	);

export const Settings = () => {
	const [logIPCFromNative, setLogIPCFromNative] = React.useState(storage.logIPCFromNative);
	const [logIPCFromRender, setLogIPCFromRender] = React.useState(storage.logIPCFromRender);

	const [logReduxEvents, setLogReduxEvents] = React.useState(storage.logReduxEvents);
	const [logInterceptsRegex, setLogInterceptsRegex] = React.useState(storage.logInterceptsRegex);

	const [debugPort, setDebugPort] = React.useState<number | undefined>(undefined);

	const nativeDebugging = debugPort !== undefined;
	return (
		<>
			<TritonTitle title={"Event Log"} desc={"Logs IPC and Intercept events to console"} />
			<TritonSettings>
				<TritonSwitchSetting
					title="Native IPC"
					desc="Log Native -> Render IPC events"
					checked={logIPCFromNative}
					onChange={async (_, checked) => {
						if (checked) await startNativeIPCLog().catch(trace.err.withContext("Failed to start native IPC logging").throw);
						else await stopNativeIPCLog().catch(trace.err.withContext("Failed to stop native IPC logging").throw);
						setLogIPCFromNative((storage.logIPCFromNative = checked));
					}}
				/>
				<TritonSwitchSetting
					title="Render IPC"
					desc="Log Render -> Native IPC events"
					checked={logIPCFromRender}
					onChange={async (_, checked) => {
						if (checked) await startRenderIpcLog().catch(trace.err.withContext("Failed to start render IPC logging").throw);
						else await stopRenderIpcLog().catch(trace.err.withContext("Failed to stop render IPC logging").throw);
						setLogIPCFromRender((storage.logIPCFromRender = checked));
					}}
				/>
				<TritonSetting title="Render redux events" desc="Log Render redux events via intercepts">
					<TritonText
						label={"Event regex match"}
						sx={{ flexGrow: 1, marginLeft: 10, marginRight: 10 }}
						value={logInterceptsRegex}
						onChange={(e) => {
							setLogInterceptsRegex((storage.logInterceptsRegex = e.target.value || ".*"));
						}}
					/>
					<TritonSwitch
						tooltip="Render redux events"
						checked={logReduxEvents}
						onChange={async (_, checked) => {
							if (checked)
								await startReduxLog(new RegExp(storage.logInterceptsRegex), trace.log.withContext("(Redux)")).catch(
									trace.err.withContext("Failed to start redux event logging").throw
								);
							else await stopReduxLog().catch(trace.err.withContext("Failed to stop redux event logging").throw);
							setLogReduxEvents((storage.logReduxEvents = checked));
						}}
					/>
				</TritonSetting>
			</TritonSettings>
			<span style={{ marginTop: 16 }} />
			<TritonTitle title={"Remote Debugging"} desc={"Toggles for triggering debugging"} />
			<TritonSettings>
				<TritonButtonSetting
					title="Native debugger"
					desc={"Enables native side debugger" + (nativeDebugging ? `. Listening on port ${debugPort}` : "")}
					onClick={() => startNativeDebugging().then(setDebugPort)}
					disabled={nativeDebugging}
					sx={{
						marginLeft: "auto",
						marginRight: 2,
						color: nativeDebugging ? "green !important" : undefined,
					}}
				>
					{nativeDebugging ? "Debugging" : "Start Debugging"}
				</TritonButtonSetting>
			</TritonSettings>
		</>
	);
};
