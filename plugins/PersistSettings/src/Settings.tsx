import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";

import React from "react";

export const storage = await ReactiveStore.getPluginStorage("PersistSettings", {
	exclusiveMode: true,
	forceVolume: false,
	normalizeVolume: false,
	autoplay: true,
	explicitContent: true,
});

export const Settings = () => {
	const [exclusiveMode, setExclusiveMode] = React.useState(storage.exclusiveMode);
	const [forceVolume, setForceVolume] = React.useState(storage.forceVolume);
	const [normalizeVolume, setNormalizeVolume] = React.useState(storage.normalizeVolume);

	const [autoplay, setAutoplay] = React.useState(storage.autoplay);
	const [explicitContent, setExplicitContent] = React.useState(storage.explicitContent);

	return (
		<LunaSettings>
			<LunaSwitchSetting
				title="Exclusive mode"
				desc="With exclusive mode, TIDAL has exclusive use of the audio device"
				checked={exclusiveMode}
				onChange={(_, checked) => {
					setExclusiveMode((storage.exclusiveMode = checked));
				}}
			/>
			<LunaSwitchSetting
				title="Force volume"
				desc="Keep TIDAL volume at max level"
				checked={forceVolume}
				onChange={(_, checked) => {
					setForceVolume((storage.forceVolume = checked));
				}}
			/>
			<LunaSwitchSetting
				title="Normalize volume"
				desc="Set the same volume level for all tracks (not reccomended)"
				checked={normalizeVolume}
				onChange={(_, checked) => {
					setNormalizeVolume((storage.normalizeVolume = checked));
				}}
			/>
			<LunaSwitchSetting
				title="Autoplay"
				desc="Play similar songs or Live sessions after the last track in your queue ends"
				checked={autoplay}
				onChange={(_, checked) => {
					setAutoplay((storage.autoplay = checked));
				}}
			/>
			<LunaSwitchSetting
				title="Explicit content"
				desc="Allow explicit content labeled with the E tag. This doesnt include videos"
				checked={explicitContent}
				onChange={(_, checked) => {
					setExplicitContent((storage.explicitContent = checked));
				}}
			/>
		</LunaSettings>
	);
};
