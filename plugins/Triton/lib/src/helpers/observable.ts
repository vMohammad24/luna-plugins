import { tritonUnloads } from "../unloads";

type ObserveCallback = (elem: Element) => unknown;
type ObserveEntry = [selector: string, callback: ObserveCallback];
const observables = new Set<ObserveEntry>();
const observer = new MutationObserver((records) => {
	if (observables.size === 0) return;

	const seenElems = new Set<Node>();

	for (const record of records) {
		const elem = record.target;
		if (elem.nodeType !== Node.ELEMENT_NODE || seenElems.has(elem)) continue;
		seenElems.add(elem);
		for (const obs of observables) {
			const sel = obs[0];
			const cb = obs[1];
			// Cast to elem as we are save checking nodeType === Node.ELEMENT_NODE
			if ((<Element>elem).matches(sel)) cb(<Element>elem);
			for (const el of (<Element>elem).querySelectorAll(sel)) cb(el);
		}
	}
});
tritonUnloads.add(observer.disconnect.bind(observer));

export const observe = (selector: string, cb: ObserveCallback): (() => void) => {
	if (observables.size === 0)
		observer.observe(document.body, {
			subtree: true,
			childList: true,
		});
	const entry: ObserveEntry = [selector, cb];
	observables.add(entry);
	return () => {
		observables.delete(entry);
		if (observables.size === 0) observer.disconnect();
	};
};

export const observePromise = <T extends Element>(selector: string, timeoutMs: number) =>
	new Promise<T | null>((res) => {
		const unob = observe(selector, (elem) => {
			unob();
			clearTimeout(timeout);
			res(elem as T);
		});
		const timeout = setTimeout(() => {
			unob();
			res(null);
		}, timeoutMs);
	});
