export const _default = (module: any) => module.default.default;
export const importNative = (path: string) => Function(`return import("${path}")`)();
