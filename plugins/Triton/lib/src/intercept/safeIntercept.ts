import { intercept } from "@neptune";

import type { ActionType } from "neptune-types/api/intercept";
import type { ActionTypes } from "neptune-types/tidal";
import type { Unload } from "../unloads";

type InterceptCallback<P, T> = (payload: P, at: T) => true | unknown;

export function safeIntercept<AT extends keyof ActionTypes>(type: AT, cb: InterceptCallback<ActionTypes[AT], AT>, unloads: Set<Unload>, once?: boolean): void;
export function safeIntercept<AT extends keyof ActionTypes>(type: AT[], cb: InterceptCallback<ActionTypes[AT], AT>, unloads: Set<Unload>, once?: boolean): void;
export function safeIntercept<V>(type: string, cb: InterceptCallback<V, string>, unloads: Set<Unload>, once?: boolean): void;
export function safeIntercept(type: string | string[], cb: (payload: unknown, at: string) => unknown, unloads: Set<Unload>, once?: boolean): void {
	unloads.add(
		intercept(
			type as ActionType,
			([payload, cbType]) => {
				if (cb(payload, cbType) === true) return true;
			},
			once
		)
	);
}
