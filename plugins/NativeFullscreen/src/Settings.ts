import { getSettings, SwitchSetting } from "@inrixia/lib";
import { html } from "@neptune/voby";
import { setTopBarVisibility } from ".";

export const settings = getSettings({
	useTidalFullscreen: false,
	alwaysHideTopBar: false,
});

export const Settings = () => html`<div>
	<${SwitchSetting} checked=${settings.useTidalFullscreen} onClick=${() => (settings.useTidalFullscreen = !settings.useTidalFullscreen)} title="Always use Tidal Fullscreen mode" />
	<${SwitchSetting} checked=${settings.alwaysHideTopBar} onClick=${() => setTopBarVisibility(!(settings.alwaysHideTopBar = !settings.alwaysHideTopBar))} title="Always hide top bar" />
</div>`;
