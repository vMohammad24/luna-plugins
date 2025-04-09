import type { Unload } from "../unloads";

export class StyleTag {
	public readonly styleTag: HTMLElement;
	constructor(public readonly id: string, unloadables: Set<Unload>, private _css?: string) {
		this.styleTag = (id ? document.getElementById(id) : this.createElement()) ?? this.createElement();
		this.css = _css;
		unloadables.add(this.remove.bind(this));
	}

	private createElement() {
		const styleTag = document.createElement("style");
		if (this.id) styleTag.id = this.id;
		return styleTag;
	}
	public remove() {
		this.styleTag.remove();
	}
	public add() {
		document.head.appendChild(this.styleTag);
	}

	public get css() {
		return this._css;
	}
	public set css(css: string | undefined) {
		this._css = css?.trim();
		if (this._css === undefined || this._css === "") this.remove();
		else {
			this.styleTag.innerHTML = this._css;
			if (!this.styleTag.isConnected) this.add();
		}
	}
}
