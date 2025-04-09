import type { default as Quartz } from "@uwu/quartz";
// @ts-expect-error This exists types arent updated
import { quartz } from "@neptune";
import { id } from "@plugin";

import { fetchText, registerEmitter, Tracer, type AddReceiver, type EmitEvent, type Unload } from "@triton/lib";

export const tritonUnloads = new Set<Unload>();
const unloadIt = async (unload: Unload) => {
	try {
		await unload();
		tritonUnloads.delete(unload);
	} catch (err) {
		tritonTracer.err.withContext(`Error unloading ${unload.source ?? ""} ${unload.name}`)(err);
	}
};
export const onUnload = () => tritonUnloads.forEach(unloadIt);

const tritonTracer = Tracer("[Triton]");

// Ensure that @triton/lib is loaded onto window for plugins to use shared memory space
import * as TritonLib from "../lib/src";
// @ts-expect-error Where were going we dont need types
window.triton = TritonLib;

const getOrigin = () => {
	const url = new URL(id);
	const pathParts = url.pathname.split("/");
	pathParts.pop();
	return `${url.origin}${pathParts.join()}`;
};

type ModuleExports = {
	unloads?: Set<Unload>;
	Settings?: () => React.JSX.Element;
};
export class TritonModule {
	public static readonly origin: string = getOrigin();

	public exports?: ModuleExports;
	public hash?: string;
	public readonly uri: string;

	private _disableLiveReload?: Unload;
	public get liveReload() {
		return this._disableLiveReload !== undefined;
	}
	public set liveReload(liveReload) {
		if (!liveReload) {
			if (this._disableLiveReload) unloadIt(this._disableLiveReload);
		} else {
			const liveReloadInterval = setInterval(this.loadExports.bind(this), 1000);
			tritonUnloads.add((this._disableLiveReload ??= () => clearInterval(liveReloadInterval)));
		}
	}

	public static readonly plugins: Record<string, TritonModule> = {};
	public static fromName(name: string) {
		return (this.plugins[name] ??= new this(name));
	}
	private constructor(public readonly name: string) {
		this.uri = `${TritonModule.origin}/tritonModules/${this.name}`;
		[this.onExports, this.loaded] = registerEmitter<ModuleExports>();
	}

	public readonly onExports: AddReceiver<ModuleExports>;
	private readonly loaded: EmitEvent<ModuleExports>;

	public async loadExports(): Promise<ModuleExports | undefined> {
		try {
			const hash = await fetchText(`${this.uri}.hash`);
			if (hash === this.hash && this.exports) return this.exports;
			const code = await fetchText(`${this.uri}.js`);

			// unload existing module
			for (const unload of this.exports?.unloads ?? []) {
				unloadIt(unload);
				// Make sure its unloads are removed from Tritons after unloading
				tritonUnloads.delete(unload);
			}

			this.exports = await (quartz as typeof Quartz)(code, {
				plugins: [
					{
						resolve({ name }) {
							if (name.startsWith("@neptune")) {
								return `window${name
									.slice(1)
									.split("/")
									.map((i) => `[${JSON.stringify(i)}]`)
									.join("")}`;
							}
							if (name.startsWith("@triton/lib")) {
								return `window.triton`;
							}
						},
					},
				],
			});
			this.hash = hash;

			for (const unload of this.exports.unloads ?? []) {
				unload.source ??= this.name;
				// Add this modules unloads to tritons so they are triggered un plugin reload
				tritonUnloads.add(unload);
			}
			tritonTracer.msg.log(`Loaded module ${this.name}`);
			this.loaded(this.exports, tritonTracer.err.withContext(`Calling ${this.name}.loaded`));
			return this.exports;
		} catch (err) {
			tritonTracer.msg.err.withContext(`Failed to load module ${this.name}`)(err);
		}
	}
}
