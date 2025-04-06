export class EstrCache {
	public static get store(): Record<any, any> {
		// @ts-expect-error
		return window.Estr ?? (window.Estr = {});
	}

	public static subCache(key: string): Record<any, any> {
		return (this.store[key] ??= {});
	}
}
