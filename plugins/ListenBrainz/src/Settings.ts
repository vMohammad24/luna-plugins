import { getSettings, TextInput } from "@inrixia/lib";
import { html } from "@neptune/voby";

export const settings = getSettings({
	userToken: "",
});

export const Settings = () => html`<div>
	<${TextInput} text=${settings.userToken} onText=${(text: string) => (settings.userToken = text)} title="User token found on https://listenbrainz.org/profile/" />
</div>`;
