export type Receiver<V> = (value: V) => unknown;
export type Emit<V> = (eventValue: V, onError: (err: Error) => unknown) => Promise<unknown>;
export type AddReceiver<V> = (cb: Receiver<V>) => () => void;
export type AddEmitter<V> = (emitEvent: Emit<V>) => unknown;

export function registerEmitter<V>(): [onEvent: AddReceiver<V>, emitEvent: Emit<V>];
export function registerEmitter<V>(registerEmitter: AddEmitter<V>): AddReceiver<V>;
export function registerEmitter<V>(registerEmitter?: AddEmitter<V>): [onEvent: AddReceiver<V>, emitEvent: Emit<V>] | AddReceiver<V> {
	const listeners = new Set<Receiver<V>>();
	const onEventValue: Emit<V> = async (eventValue, onError) => {
		const promises = [];
		for (const listener of listeners) {
			try {
				const res = listener(eventValue);
				if (res instanceof Promise) promises.push(res);
			} catch (err) {
				if (err instanceof Error) onError(err);
				else onError(new Error(err?.toString()));
			}
		}
		await Promise.all(promises);
	};
	const addReceiver: AddReceiver<V> = (cb: Receiver<V>) => {
		listeners.add(cb);
		return () => {
			listeners.delete(cb);
		};
	};
	if (registerEmitter) {
		registerEmitter(onEventValue);
		return addReceiver;
	}
	return [addReceiver, onEventValue];
}
