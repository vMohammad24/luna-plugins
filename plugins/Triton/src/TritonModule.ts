import type { default as Quartz } from "@uwu/quartz";
// @ts-expect-error This exists types arent updated
import { quartz } from "@neptune";
import { id } from "@plugin";

import { fetchText, getStorage, setDefaults, Signal, tritonTracer, tritonUnloads, unloadSet, type Unload } from "@triton/lib";

// Ensure that @triton/lib is loaded onto window for plugins to use shared memory space
import { Semaphore } from "@inrixia/helpers";
import * as TritonLib from "@triton/lib";
import React from "react";
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
	Settings?: React.FC;
};

interface TritonModuleStore {
	code?: string;
	hash?: string;
	enabled: boolean;
	liveReload: boolean;
}

const moduleCache = getStorage<Record<string, TritonModuleStore>>("TritonModuleStore", {});

export class TritonModule {
	public static readonly origin: string = getOrigin();
	public readonly uri: string;

	public static readonly modules: Record<string, TritonModule> = {};
	public static fromName(name: string) {
		return (this.modules[name] ??= new this(name));
	}
	private constructor(public readonly name: string) {
		this.uri = `${TritonModule.origin}/tritonModules/${this.name}`;
		tritonUnloads.add(() => {
			// Ensure reloadLoop is not running on unload
			this.stopReloadLoop();
		});

		const defaults = {
			enabled: true,
			liveReload: false,
		};
		this._store = setDefaults<TritonModuleStore>((moduleCache[this.uri] ??= defaults), defaults);

		// Enabled has to be setup first because liveReload below accesses it
		this._enabled = new Signal(this._store.enabled);
		this._enabled.onValue((next) => {
			this._store.enabled = next;
		});
		this.onEnabled = this._enabled.onValue.bind(this._enabled);

		this.liveReload = new Signal(this._store.liveReload);
		this.liveReload.onValue((next) => {
			if ((this._store.liveReload = next)) this.startReloadLoop();
			else this.stopReloadLoop();
		});

		if (this.enabled) this.enable();
	}

	private readonly _store: TritonModuleStore;

	private _reloadTimeout?: NodeJS.Timeout;
	private startReloadLoop() {
		if (this._reloadTimeout) return;
		const reloadLoop = async () => {
			if (!this.enabled) return;
			await this.loadExports();
			this._reloadTimeout = setTimeout(reloadLoop.bind(this), 1000);
		};
		reloadLoop();
	}
	private stopReloadLoop() {
		clearTimeout(this._reloadTimeout);
		this._reloadTimeout = undefined;
	}

	public readonly loading: Signal<boolean> = new Signal(false);
	public Settings = new Signal<React.FC | undefined>(this._exports?.Settings);
	public readonly liveReload: Signal<boolean>;

	private readonly _enabled: Signal<boolean>;
	public onEnabled;

	public get enabled() {
		return this._enabled._;
	}

	private readonly _exports?: ModuleExports;
	private get exports() {
		return this._exports;
	}
	private set exports(exports: ModuleExports | undefined) {
		// Cast to set, _exports is readonly to avoid accidental internal modification
		(<ModuleExports | undefined>this._exports) = exports;
		this.Settings._ = exports?.Settings;
	}

	// #region Store Values
	private get code() {
		return this._store.code;
	}
	private set code(value) {
		this._store.code = value;
	}
	private get hash() {
		return this._store.hash;
	}
	private set hash(value) {
		this._store.hash = value;
	}
	// #endregion

	private async unload(): Promise<void> {
		this.loading._ = true;
		await unloadSet(this.exports?.unloads);
		this.exports = undefined;
		this.loading._ = false;
	}

	public async enable() {
		await this.loadExports(true);
		this._enabled._ = true;
		// Ensure live reload is running it it should be
		if (this.liveReload._) this.startReloadLoop();
	}
	public async disable() {
		// Disable the reload loop
		this.stopReloadLoop();
		await this.unload();
		this._enabled._ = false;
	}
	public async reload() {
		await this.disable();
		await this.enable();
	}

	/**
	 * Returns true if code changed
	 */
	private async fetchNewCode(): Promise<boolean> {
		try {
			const hash = await fetchText(`${this.uri}.hash`);
			// TODO switch to checking hash against actual code hash
			if (this.hash !== hash) {
				this.code = await fetchText(`${this.uri}.js`);
				this.hash = hash;
				return true;
			}
		} catch {}
		return false;
	}

	private readonly loadSemaphore: Semaphore = new Semaphore(1);
	private async loadExports(force: boolean = false): Promise<void> {
		this.loading._ = true;
		// Ensure we cant start loading midway through loading
		const release = await this.loadSemaphore.obtain();
		try {
			if (!force && !this.enabled) return;
			// If code hasnt changed and we have already loaded exports we are done
			if (!(await this.fetchNewCode()) && this.exports !== undefined) return;

			// If code failed to fetch then nothing we can do
			if (this.code === undefined) return;

			// Ensure we unload if previously loaded
			await this.unload();

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
				// Set unload source for context if function fails to call
				unload.source ??= this.name;
				// Add this modules unloads to tritons so they are triggered if triton is unloaded
				tritonUnloads.add(unload);
			}
			tritonTracer.msg.log(`Loaded module ${this.name}`);
		} catch (err) {
			tritonTracer.msg.err.withContext(`Failed to load module ${this.name}`)(err);
		} finally {
			release();
			this.loading._ = false;
		}
	}
}
