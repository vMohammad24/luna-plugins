import { SharedObjectStore } from "./SharedObjectStore";

type ValueWithExpiry<V> = { value: V; expires: number; expired: boolean } | { value: V; expires: undefined; expired: true } | { value: undefined; expires: undefined; expired: undefined };
export class SharedObjectStoreExpirable<K extends IDBValidKey, V extends Record<any, any> & { __expires?: never }> extends SharedObjectStore<K, V> {
	private readonly maxAge?: number;
	constructor(
		storeName: string,
		options?: {
			/**
			 * maxAge for items to persist in cache in ms
			 */
			maxAge?: number;
			storeSchema?: IDBObjectStoreParameters;
		}
	) {
		const { maxAge, storeSchema } = options ?? {};
		super(storeName, storeSchema);
		this.maxAge = maxAge;
	}
	private setExpires(value: any, expiresAt?: number): void {
		if (expiresAt !== undefined) value.__expires = expiresAt;
		else if (this.maxAge !== undefined) value.__expires = Date.now() + this.maxAge;
		else throw new Error("maxAge or expires must be set!");
	}
	private clearExpires(value: any): void {
		delete value.__expires;
	}
	private isTooOld(value?: V): boolean {
		if (value?.__expires === undefined) return true;
		return Date.now() > value.__expires;
	}
	async add(value: V, key?: K) {
		this.setExpires(value);
		return super.add(value, key);
	}
	async put(value: V, key?: K) {
		this.setExpires(value);
		return super.put(value, key);
	}
	async addExpires(value: V, expiresAt: number, key?: K) {
		this.setExpires(value, expiresAt);
		return super.add(value, key);
	}
	async putExpires(value: V, expiresAt: number, key?: K) {
		this.setExpires(value, expiresAt);
		return super.put(value, key);
	}
	async get(key: K): Promise<V | undefined> {
		const value = await super.get(key);
		if (this.isTooOld(value)) return undefined;
		this.clearExpires(value);
		return value;
	}
	async getWithExpiry(key: K): Promise<ValueWithExpiry<V>> {
		const value = await super.get(key);
		if (value === undefined) return { value: undefined, expires: undefined, expired: undefined };
		const expires = value.__expires;
		const expired = this.isTooOld(value);
		this.clearExpires(value);
		return { value, expires, expired };
	}
	async getAll(key?: K | null, count?: number) {
		const values = await super.getAll(key, count);
		return values.filter(this.isTooOld.bind(this)).map(this.clearExpires.bind(this));
	}
}
