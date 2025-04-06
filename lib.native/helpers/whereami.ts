export const inRenderer = globalThis?.process === undefined;
export const inNative = !inRenderer;
