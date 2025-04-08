import type { default as Quartz } from "@uwu/quartz";
// @ts-expect-error This exists types arent updated
import { quartz } from "@neptune";
import { id } from "@plugin";

import { fetchText, Tracer, unloads, type Unload } from "@triton/lib";
import { unloadIt } from ".";

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
	onUnload?: Unload;
	Settings?: React.JSX.Element;
};
export class TritonModule {
	public static readonly origin: string = getOrigin();

	public module?: ModuleExports;
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
			const liveReloadInterval = setInterval(this.loadModule.bind(this), 1000);
			unloads.add((this._disableLiveReload ??= () => clearInterval(liveReloadInterval)));
		}
	}

	public static readonly plugins: Record<string, TritonModule> = {};
	public static fromName(name: string) {
		return (this.plugins[name] ??= new this(name));
	}
	private constructor(public readonly name: string) {
		this.uri = `${TritonModule.origin}/tritonModules/${this.name}`;
	}

	private _onloaddb: any = null;
	public onLoad(cb: (Settings: React.JSX.Element) => void) {
		this._onloaddb = cb;
	}

	public async loadModule(): Promise<ModuleExports | undefined> {
		try {
			const hash = await fetchText(`${this.uri}.hash`);
			if (hash === this.hash && this.module) return this.module;

			const code = await fetchText(`${this.uri}.js`);
			if (this.module?.onUnload) unloadIt(this.module?.onUnload);

			this.module = await (quartz as typeof Quartz)(code, {
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

			const onUnload = this.module.onUnload;
			if (onUnload) {
				onUnload.source = `${this.name}.${onUnload.source}`;
				unloads.add(onUnload);
			}
			tritonTracer.msg.log(`Loaded module ${this.name}`);
			this._onloaddb(this.module.Settings);
			return this.module;
		} catch (err) {
			tritonTracer.msg.err.withContext(`Failed to load module ${this.name}`)(err);
		}
	}
}
