import { safeIntercept, unloadSet, type InterceptCallback, type Unload } from "@triton/lib";

function convertToUpperCaseWithUnderscores(str: string) {
	return str
		.replace(/([a-z0-9])([A-Z])/g, "$1_$2") // Convert camelCase to snake_case
		.toUpperCase(); // Convert to uppercase
}
const neptuneActions = window.neptune.actions;
const interceptUnloads = new Set<Unload>();
export const startReduxLog = async (actionPath: RegExp, handler: InterceptCallback<string, unknown>) => {
	for (const item in neptuneActions) {
		for (const action in window.neptune.actions[<keyof typeof neptuneActions>item]) {
			const interceptPath = `${item}/${convertToUpperCaseWithUnderscores(action)}`;
			if (!actionPath.test(interceptPath)) continue;
			safeIntercept(interceptPath, handler, interceptUnloads);
		}
	}
};
export const stopReduxLog = async () => unloadSet(interceptUnloads);
