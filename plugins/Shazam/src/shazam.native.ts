import init, { recognizeBytes, type DecodedSignature } from "shazamio-core/web";
init();

import { v4 } from "uuid";

import { memoize } from "@inrixia/helpers";
import { requestJson } from "@inrixia/lib.native";

import type { ShazamData } from "./api.types";

export const using = async <T>(signatures: DecodedSignature[], fun: (signatures: ReadonlyArray<DecodedSignature>) => T) => {
	const ret = await fun(signatures);
	for (const signature of signatures) signature.free();
	return ret;
};

export const fetchShazamData = memoize(async (signature: { samplems: number; uri: string }) =>
	requestJson<ShazamData>(
		`https://amp.shazam.com/discovery/v5/en-US/US/iphone/-/tag/${v4()}/${v4()}?sync=true&webv3=true&sampling=true&connected=&shazamapiversion=v3&sharehub=true&hubv5minorversion=v5.1&hidelb=true&video=v3`,
		{
			headers: { "Content-Type": "application/json" },
			method: "POST",
			body: JSON.stringify({ signature }),
		}
	)
);

type Opts = {
	bytes: ArrayBuffer;
	startInMiddle: boolean;
	exitOnFirstMatch: boolean;
};

export const recognizeTrack = async ({ bytes, startInMiddle, exitOnFirstMatch }: Opts) => {
	const matches: ShazamData[] = [];
	await using(recognizeBytes(new Uint8Array(bytes), 0, Number.MAX_SAFE_INTEGER), async (signatures) => {
		let i = startInMiddle ? Math.floor(signatures.length / 2) : 1;
		for (; i < signatures.length; i += 4) {
			const sig = signatures[i];
			const shazamData = await fetchShazamData({ samplems: sig.samplems, uri: sig.uri });
			matches.push(shazamData);
			if (shazamData.matches.length === 0) continue;
			if (exitOnFirstMatch) return;
		}
	});
	return matches;
};
