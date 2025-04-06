import { html } from "@neptune/voby";

import { getSettings, SwitchSetting } from "@inrixia/lib";

export const settings = getSettings({
	exitOnFirstMatch: true,
	startInMiddle: true,
});
export const Settings = () => html`<div>
	<${SwitchSetting} checked=${settings.exitOnFirstMatch} onClick=${() => (settings.exitOnFirstMatch = !settings.exitOnFirstMatch)} title="Stop searching on the first match" />
	<${SwitchSetting} checked=${settings.startInMiddle} onClick=${() => (settings.startInMiddle = !settings.startInMiddle)} title="Start searching in the middle of the song" />
</div>`;
