import { fetchJson, findModuleFunction, getStorage } from "@triton/lib";

const lastFmSecret = findModuleFunction<string>("lastFmSecret", "string");
const lastFmApiKey = findModuleFunction<string>("lastFmApiKey", "string");

if (lastFmSecret === undefined) throw new Error("Last.fm secret not found");
if (lastFmApiKey === undefined) throw new Error("Last.fm API key not found");

const storage = getStorage<{
	session?: LastFmSession;
}>("LastFM", {});

import { NowPlaying } from "./types/NowPlaying";
import { Scrobble } from "./types/Scrobble";

import { hash } from "./hash.native";

export type NowPlayingOpts = {
	track: string;
	artist: string;
	album?: string;
	trackNumber?: string;
	context?: string;
	mbid?: string;
	duration?: string;
	albumArtist?: string;
};

export interface ScrobbleOpts extends NowPlayingOpts {
	timestamp: string;
	streamId?: string;
	chosenByUser?: string;
}

export type LastFmSession = {
	name: string;
	key: string;
	subscriber: number;
};

type ResponseType<T> =
	| (T & { message?: undefined })
	| {
			message: string;
	  };

export class LastFM {
	private static async generateApiSignature(params: Record<string, string>) {
		const sig =
			Object.keys(params)
				.filter((key) => key !== "format" && key !== undefined)
				.sort()
				.map((key) => `${key}${params[key]}`)
				.join("") + lastFmSecret;
		return hash(sig);
	}

	private static async sendRequest<T>(method: string, params?: Record<string, string>) {
		params ??= {};
		params.method = method;
		params.api_key = lastFmApiKey!;
		params.format = "json";
		params.api_sig = await LastFM.generateApiSignature(params);

		const data = await fetchJson<ResponseType<T>>(`https://ws.audioscrobbler.com/2.0/`, {
			headers: {
				"Content-type": "application/x-www-form-urlencoded",
				"Accept-Charset": "utf-8",
			},
			method: "POST",
			body: new URLSearchParams(params).toString(),
		});

		if (data.message) throw new Error(data.message);
		else return <T>data;
	}

	private static getSession = async (): Promise<LastFmSession> => {
		if (storage.session !== undefined) return storage.session;
		const { token } = await LastFM.sendRequest<{ token: string }>("auth.getToken");
		const authUrl = `https://www.last.fm/api/auth/?api_key=${lastFmApiKey}&token=${token}`;
		window.open(authUrl, "_blank");
		const result = window.confirm(`Go to "${authUrl}" give TIDAL permission on the opened page and then confirm.`);
		if (!result) throw new Error("Authentication cancelled");
		const { session } = await LastFM.sendRequest<{ session: LastFmSession }>("auth.getSession", { token });
		return (storage.session = session);
	};

	public static async updateNowPlaying(opts: NowPlayingOpts) {
		const session = await LastFM.getSession();
		return LastFM.sendRequest<NowPlaying>("track.updateNowPlaying", {
			...opts,
			sk: session.key,
		});
	}

	public static async scrobble(opts?: ScrobbleOpts) {
		const session = await LastFM.getSession();
		return LastFM.sendRequest<Scrobble>("track.scrobble", {
			...opts,
			sk: session.key,
		});
	}
}
