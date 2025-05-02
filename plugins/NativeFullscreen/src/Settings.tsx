import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";

import { setTopBarVisibility } from ".";

import React from "react";

export const storage = await ReactiveStore.getPluginStorage("NativeFullscreen", {
	useTidalFullscreen: false,
	hideTopBar: false,
});

export const Settings = () => {
	const [useTidalFullscreen, setUseTidalFullscreen] = React.useState(storage.useTidalFullscreen);
	const [hideTopBar, setHideTopBar] = React.useState(storage.hideTopBar);
	return (
		<LunaSettings>
			<LunaSwitchSetting
				title="Use tidal fullscreen windowed"
				desc="Triggers the Tidal fullscreen mode on F11 while keeping the application windowed"
				checked={useTidalFullscreen}
				onChange={(_, checked) => setUseTidalFullscreen((storage.useTidalFullscreen = checked))}
			/>
			<LunaSwitchSetting
				title="Hide top bar"
				desc="Always hide the top application bar"
				checked={hideTopBar}
				onChange={(_, checked) => {
					setTopBarVisibility(!checked);
					setHideTopBar((storage.hideTopBar = checked));
				}}
			/>
		</LunaSettings>
	);
};
