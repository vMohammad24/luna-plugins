import { intercept } from "@neptune";
import { ActionType, UninterceptFunction } from "neptune-types/api/intercept";
import { ActionTypes } from "neptune-types/tidal";

function convertToUpperCaseWithUnderscores(str: string) {
	return str
		.replace(/([a-z0-9])([A-Z])/g, "$1_$2") // Convert camelCase to snake_case
		.toUpperCase(); // Convert to uppercase
}
const neptuneActions = window.neptune.actions;
export type ActionHandler = <AT extends ActionType>(interceptPath: AT, payload: ActionTypes[AT]) => void;
export const interceptActions = (actionPath: RegExp, handler: ActionHandler) => {
	const unloadables: UninterceptFunction[] = [];
	for (const item in neptuneActions) {
		for (const action in window.neptune.actions[<keyof typeof neptuneActions>item]) {
			const interceptPath = `${item}/${convertToUpperCaseWithUnderscores(action)}`;
			if (!actionPath.test(interceptPath)) continue;
			unloadables.push(intercept(<ActionType>interceptPath, (...payload) => handler(<ActionType>interceptPath, ...payload)));
		}
	}
	return () => unloadables.forEach((u) => u());
};
