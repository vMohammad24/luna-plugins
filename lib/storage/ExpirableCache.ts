type WithExpiry<V> = [value: V, expiresEpoch: number];
export class ExpirableCache<K extends string | number | symbol, V extends unknown> {
	private readonly _cache: Record<K, WithExpiry<V>> = {} as Record<K, WithExpiry<V>>;
	constructor() {}
	set(key: K, value: V, expiresEpoch: number): void {
		this._cache[key] = [value, expiresEpoch];
	}
	get(key: K): V {
		return this._cache[key]?.[0];
	}
	getWithExpiry(key: K): [value: V, expired: boolean] | [] {
		if (key in this._cache) {
			const [value, expiresEpoch] = this._cache[key];
			return [value, Date.now() > expiresEpoch];
		}
		return [];
	}
}
