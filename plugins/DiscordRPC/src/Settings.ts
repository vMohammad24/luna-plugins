import { SwitchSetting, getSettings } from "@inrixia/lib";

import { html } from "@neptune/voby";
import { updateActivity } from ".";

export const settings = getSettings({
	displayArtistImage: true,
});

export const Settings = () => html` <${SwitchSetting}
	checked=${settings.displayArtistImage}
	onClick=${() => {
		settings.displayArtistImage = !settings.displayArtistImage;
		updateActivity();
	}}
	title="Display artist image"
/>`;
