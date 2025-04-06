import { Semaphore } from "@inrixia/helpers";
import { requestJson } from "../../native/request/requestJson.native";

const CLIENT_ID = "tzecdDS3Bbx00rMP";
const CLIENT_SECRET = "zhRnKETi4FeXNGB72yAPJDssJ1U3BBGqmvYKcaw3kk8=";

const tokenStore = {
	token: "",
	expiresAt: -1,
};
type TokenInfo = {
	scope: string;
	token_type: string;
	access_token: string;
	expires_in: number;
};
const authSema = new Semaphore(1);
export const getToken = async () => {
	const release = await authSema.obtain();
	try {
		if (tokenStore.expiresAt > Date.now()) return tokenStore.token;
		const { access_token, expires_in } = await requestJson<TokenInfo>("https://auth.tidal.com/v1/oauth2/token", {
			method: "POST",
			headers: {
				Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "client_credentials",
			}).toString(),
		});

		tokenStore.token = access_token;
		tokenStore.expiresAt = Date.now() + (expires_in - 60) * 1000;
		return tokenStore.token;
	} finally {
		release();
	}
};
