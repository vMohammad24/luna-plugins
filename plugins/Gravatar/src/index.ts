import { LunaUnload } from "@luna/core";
import { redux, StyleTag } from "@luna/lib";
import { md5 } from "./md5.native";

export const unloads = new Set<LunaUnload>();
const avatarCSS = new StyleTag("avatarCSS", unloads);

const { user, userProfiles } = redux.store.getState();
if (userProfiles[user.meta.id].picture === null) {
	// Thx @n1ckoates
	avatarCSS.css = `
		[class^="_profilePicture_"] {
			background-image: url("https://www.gravatar.com/avatar/${await md5(user.meta.email)}?d=identicon");
			background-size: cover;
		}

		[class^="_profilePicture_"] svg {
			display: none;
		}
	`;
}
