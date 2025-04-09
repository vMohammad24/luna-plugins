export type EventReceiver<V> = (value: V) => unknown;
export type EmitEvent<V> = (eventValue: V, onError: (err: Error) => unknown) => Promise<unknown>;
export type AddReceiver<V> = (cb: EventReceiver<V>) => () => void;

export function registerEmitter<V>(): [onEvent: AddReceiver<V>, emitEvent: EmitEvent<V>];
export function registerEmitter<V>(registerEmitter: (emitEvent: EmitEvent<V>) => unknown): AddReceiver<V>;
export function registerEmitter<V>(registerEmitter?: (emitEvent: EmitEvent<V>) => unknown): [onEvent: AddReceiver<V>, emitEvent: EmitEvent<V>] | AddReceiver<V> {
	const listeners = new Set<EventReceiver<V>>();
	const onEventValue: EmitEvent<V> = async (eventValue, onError) => {
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
	const addReceiver: AddReceiver<V> = (cb: EventReceiver<V>) => {
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
