export const rejectNotOk = (res: Response): Response => {
	const OK = res.status !== undefined && res.status >= 200 && res.status < 300;
	if (!OK) throw new Error(`${res.status} ${res.statusText}`);
	return res;
};

export const toJson = <T>(res: Response): Promise<T> => res.json();
export const toText = (res: Response): Promise<string> => res.text();

export const fetchJson = <T>(...args: Parameters<typeof fetch>) =>
	fetch(...args)
		.then(rejectNotOk)
		.then(toJson<T>);

export const fetchText = (...args: Parameters<typeof fetch>) =>
	fetch(...args)
		.then(rejectNotOk)
		.then(toText);
