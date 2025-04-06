import { Tracer } from "../helpers/trace";
const trace = Tracer("[lib.tidalApi]");

import { memoize } from "@inrixia/helpers";
import { requestJson } from "@inrixia/lib.native";
import { getToken } from "./auth";
import { TApiTrack, TApiTracks } from "./types";

const fetchTidal = memoize(async <T>(url: string) =>
	requestJson<T>(url, {
		headers: {
			Authorization: `Bearer ${await getToken()}`,
			"Content-Type": "application/vnd.tidal.v1+json",
		},
	})
);

const baseURL = "https://openapi.tidal.com/v2";

export async function* fetchIsrcIterable(isrc: string): AsyncIterable<TApiTrack> {
	let resp = await fetchTidal<TApiTracks | undefined>(`${baseURL}/tracks?countryCode=US&filter[isrc]=${isrc}`);
	while (true) {
		if (resp?.data === undefined || resp.data.length === 0) break;
		yield* resp.data;
		if (resp.links.next === undefined) break;
		resp = await fetchTidal<TApiTracks>(`${baseURL}${resp.links.next}`).catch((err) => trace.err(`Unexpected error when fetching Tidal ISRC ${isrc}: ${err}`));
	}
}
