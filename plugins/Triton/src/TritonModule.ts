import type { default as Quartz } from "@uwu/quartz";
// @ts-expect-error This exists types arent updated
import { quartz } from "@neptune";
import { id } from "@plugin";

import { fetchText, getStorage, registerEmitter, tritonTracer, tritonUnloads, unloadIt, type AddReceiver, type EmitEvent, type Unload } from "@triton/lib";

// Ensure that @triton/lib is loaded onto window for plugins to use shared memory space
import * as TritonLib from "@triton/lib";
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

interface TritonModuleBase {
	code?: string;
	hash?: string;
}

const moduleCache = getStorage<Record<string, TritonModuleBase>>("TritonModuleCache", {});

export class TritonModule implements TritonModuleBase {
	public static readonly origin: string = getOrigin();

	public exports?: ModuleExports;
	public readonly uri: string;

	public get code() {
		return moduleCache[this.uri]?.code;
	}
	public set code(value) {
		moduleCache[this.uri] ??= {};
		moduleCache[this.uri].code = value;
	}

	public get hash() {
		return moduleCache[this.uri]?.hash;
	}
	public set hash(value) {
		moduleCache[this.uri] ??= {};
		moduleCache[this.uri].code = value;
	}

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
			try {
				const hash = await fetchText(`${this.uri}.hash`);
				if (hash !== this.hash) this.code = await fetchText(`${this.uri}.js`);
				else if (this.exports) return this.exports;
			} catch (err) {
				if (this.exports) return this.exports;
				// tritonTracer.msg.err(`Fetching ${this.name} code failed. ${this.code ? `Using cache` : `Module unavailable`}`);
			}
			if (!this.code) return;

			// unload existing module
			for (const unload of this.exports?.unloads ?? []) {
				unloadIt(unload);
				// Make sure its unloads are removed from Tritons after unloading
				tritonUnloads.delete(unload);
			}

			this.exports = await (quartz as typeof Quartz)(this.code, {
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
