import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";
import React from "react";

export const settings = await ReactiveStore.getPluginStorage("TidalTags", {
	displayFormatBorder: true,
});

export const Settings = () => {
	const [displayFormatBorder, setDisplayFormatBorder] = React.useState(settings.displayFormatBorder);
	return (
		<LunaSettings>
			<LunaSwitchSetting
				title="Format info border"
				desc="Display a border around format Info"
				value={displayFormatBorder}
				onChange={(_, checked) => setDisplayFormatBorder((settings.displayFormatBorder = checked))}
			/>
		</LunaSettings>
	);
};
