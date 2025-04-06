import { intercept } from "@neptune";
import { ActionType, CallbackFunction, PayloadActionTypeTuple } from "neptune-types/api/intercept";

export const interceptPromise = <RESAT extends ActionType, REJAT extends ActionType>(
	trigger: Function,
	resActionType: RESAT[],
	rejActionType: REJAT[],
	{ timeoutMs, cancel }: { timeoutMs?: number; cancel?: boolean } = {}
): Promise<PayloadActionTypeTuple<RESAT>> => {
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
	const timeout = setTimeout(() => rej(`${rejActionType ?? resActionType}_TIMEOUT`), timeoutMs);
	trigger();
	return p.finally(() => {
		clearTimeout(timeout);
		unloadRes();
		unloadRej();
	});
};
