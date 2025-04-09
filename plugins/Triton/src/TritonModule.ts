import type { default as Quartz } from "@uwu/quartz";
// @ts-expect-error This exists types arent updated
import { quartz } from "@neptune";
import { id } from "@plugin";

import { fetchText, getStorage, registerEmitter, tritonTracer, tritonUnloads, unloadIt, type AddReceiver, type Emit, type Unload } from "@triton/lib";

// Ensure that @triton/lib is loaded onto window for plugins to use shared memory space
import { Semaphore } from "@inrixia/helpers";
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
		moduleCache[this.uri].hash = value;
	}

	private _liveReload?: Promise<void> = undefined;
	public get liveReload(): boolean {
		return !!this._liveReload;
	}
	public set liveReload(liveReload: boolean) {
		if (liveReload && !this._liveReload) {
			this._liveReload = (async () => {
				do {
					await this.loadExports.bind(this)();
					await new Promise((res) => setTimeout(res, 1000));
				} while (!!this._liveReload);
			})();
		} else {
			this._liveReload = undefined;
		}
	}

	public static readonly plugins: Record<string, TritonModule> = {};
	public static fromName(name: string) {
		return (this.plugins[name] ??= new this(name));
	}
	private constructor(public readonly name: string) {
		this.uri = `${TritonModule.origin}/tritonModules/${this.name}`;
		[this.onExports, this.loaded] = registerEmitter<ModuleExports>();
		tritonUnloads.add(() => {
			this.liveReload = false;
		});
	}

	public readonly onExports: AddReceiver<ModuleExports>;
	private readonly loaded: Emit<ModuleExports>;

	private firstLoad: boolean = true;
	private readonly loadSemaphore: Semaphore = new Semaphore(1);
	public async loadExports(): Promise<ModuleExports | undefined> {
		// Ensure we cant start loading midway through loading
		const release = await this.loadSemaphore.obtain();
		try {
			// To speed up first load if we arent running and we have code
			// defer fetching code and try load immediately
			if (this.firstLoad && this.code && !this.exports) {
				this.firstLoad = false;
				// Queue a reload
				setTimeout(this.loadExports.bind(this));
			} else {
				try {
					const hash = await fetchText(`${this.uri}.hash`);
					// If code differs update
					if (hash !== this.hash) {
						this.code = await fetchText(`${this.uri}.js`);
						this.hash = hash;
					} // Otherwise if its the same and we are already loaded just return exports
					else if (this.exports) return this.exports;
				} catch {
					// If we fail to fetch but have exports then dont reload
					if (this.exports) return this.exports;
					// tritonTracer.msg.err(`Fetching ${this.name} code failed. ${this.code ? `Using cache` : `Module unavailable`}`);
				}
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
		} finally {
			release();
		}
	}
}
