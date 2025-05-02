import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";

import React from "react";

export const storage = await ReactiveStore.getPluginStorage("Shazam", {
	startInMiddle: true,
	exitOnFirstMatch: true,
});

export const Settings = () => {
	const [startInMiddle, setStartInMiddle] = React.useState(storage.startInMiddle);
	const [exitOnFirstMatch, setExitOnFirstMatch] = React.useState(storage.exitOnFirstMatch);

	return (
		<LunaSettings>
			<LunaSwitchSetting
				title="Start in middle"
				desc="Start searching in the middle of the song"
				checked={startInMiddle}
				onChange={(_, checked) => {
					setStartInMiddle((storage.startInMiddle = checked));
				}}
			/>
			<LunaSwitchSetting
				title="Stop on first"
				desc="Stop searching on the first match"
				checked={exitOnFirstMatch}
				onChange={(_, checked) => {
					setExitOnFirstMatch((storage.exitOnFirstMatch = checked));
				}}
			/>
		</LunaSettings>
	);
};
