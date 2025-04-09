import { Semaphore } from "@inrixia/helpers";
import { ActionType } from "neptune-types/api/intercept";
import type { ActionTypes } from "neptune-types/tidal";
import { unloadIt, type Unload } from "../unloads";
import { safeIntercept } from "./safeIntercept";

const intercepts: Record<ActionType, Semaphore> = {} as Record<ActionType, Semaphore>;
export const interceptPromise = async <RESAT extends ActionType, REJAT extends ActionType, RES extends ActionTypes[RESAT], REJ extends ActionTypes[REJAT]>(
	trigger: Function,
	resActionType: RESAT[],
	rejActionType: REJAT[],
	{ timeoutMs, cancel }: { timeoutMs?: number; cancel?: boolean } = {}
): Promise<RES> => {
	const unloads = new Set<Unload>();
	unloads.add(await (intercepts[resActionType[0]] ??= new Semaphore(1)).obtain());

	timeoutMs ??= 5000;
	cancel ??= false;

	return new Promise<RES>((_res: (payload: RES) => void, _rej: (err: REJ | string) => void) => {
		safeIntercept(
			resActionType,
			(payload) => {
				_res(payload);
				if (cancel) return true;
			},
			unloads,
			true
		);
		safeIntercept(rejActionType, _rej!, unloads, true);
		const timeout = setTimeout(() => _rej(`[intercept.TIMEOUT] ${resActionType[0] ?? rejActionType[0]}`), timeoutMs);
		unloads.add(() => clearTimeout(timeout));
		// Queue our action to the eventLoop
		setTimeout(trigger);
	}).finally(() => unloads.forEach(unloadIt));
};
