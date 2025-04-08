export const unloads = new Set<Unload>();
export type Unload = {
	(): Promise<void> | void;
	source?: string;
};

export { store } from "@neptune";
