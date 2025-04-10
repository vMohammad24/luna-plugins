import type { Unload } from "../unloads";

export type SignalChange<T> = (next: T, previous?: T) => unknown;
export class Signal<T> {
	private readonly _observers: Set<SignalChange<T>> = new Set();
	constructor(private value: T) {}
	public get _(): T {
		return this.value;
	}
	public set _(next: T) {
		if (next === this.value) return;
		let previous = this.value;
		this.value = next;
		// No error handling, maybeh...
		for (const cb of this._observers) cb(next, previous);
	}
	onValue(cb: SignalChange<T>): Unload {
		cb(this.value, this.value);
		this._observers.add(cb);
		return () => this._observers.delete(cb);
	}
}
