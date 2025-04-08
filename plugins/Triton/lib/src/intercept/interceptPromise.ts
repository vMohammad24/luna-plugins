import { Semaphore } from "@inrixia/helpers";
import { intercept } from "@neptune";
import { ActionType, CallbackFunction, PayloadActionTypeTuple } from "neptune-types/api/intercept";

const intercepts: Record<ActionType, Semaphore> = {} as Record<ActionType, Semaphore>;
export const interceptPromise = async <RESAT extends ActionType, REJAT extends ActionType>(
	trigger: Function,
	resActionType: RESAT[],
	rejActionType: REJAT[],
	{ timeoutMs, cancel }: { timeoutMs?: number; cancel?: boolean } = {}
): Promise<PayloadActionTypeTuple<RESAT>> => {
	const release = await (intercepts[resActionType[0]] ??= new Semaphore(1)).obtain();
	timeoutMs ??= 5000;
	cancel ??= false;
	let res: CallbackFunction<RESAT>;
	let rej: (err: PayloadActionTypeTuple<REJAT> | string) => void;
	const p = new Promise<PayloadActionTypeTuple<RESAT>>((_res, _rej) => {
		res = _res;
		rej = _rej;
	});
	const unloadRes = intercept(
		resActionType,
		(payload) => {
			res(payload);
			if (cancel) return true;
		},
		true
	);
	const unloadRej = intercept(rejActionType, rej!, true);
	const timeout = setTimeout(() => rej(`[intercept.TIMEOUT] ${resActionType[0] ?? rejActionType[0]}`), timeoutMs);
	setTimeout(trigger);
	return p.finally(() => {
		release();
		clearTimeout(timeout);
		unloadRes();
		unloadRej();
	});
};
