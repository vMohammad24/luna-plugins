import type { Payload } from "./ListenBrainzTypes.js";
import { settings } from "./Settings";

import { requestJson } from "@inrixia/lib.native";

type NowPlayingPayload = Omit<Payload, "listened_at">;

export class ListenBrainz {
	private static async sendRequest(body?: { listen_type: "single" | "playing_now"; payload: Payload[] | NowPlayingPayload[] }) {
		if (settings.userToken === "") return;
		return requestJson(`https://api.listenbrainz.org/1/submit-listens`, {
			headers: {
				"Content-type": "application/json",
				Accept: "application/json",
				Authorization: `Token ${settings.userToken}`,
			},
			method: "POST",
			body: JSON.stringify(body),
		});
	}

	public static updateNowPlaying(payload: NowPlayingPayload) {
		// @ts-expect-error Ensure this doesnt exist
		delete payload.listened_at;
		return ListenBrainz.sendRequest({
			listen_type: "playing_now",
			payload: [payload],
		});
	}

	public static scrobble(payload: Payload) {
		return ListenBrainz.sendRequest({
			listen_type: "single",
			payload: [payload],
		});
	}
}
