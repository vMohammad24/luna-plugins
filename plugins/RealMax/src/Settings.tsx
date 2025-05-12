import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";
import React from "react";

export const settings = await ReactiveStore.getPluginStorage("RealMAX", {
	displayInfoPopups: true,
});

export const Settings = () => {
	const [displayInfoPopups, setDisplayInfoPopups] = React.useState(settings.displayInfoPopups);
	return (
		<LunaSettings>
			<LunaSwitchSetting
				title="Display info popups"
				desc="Display a popup when a track is replaced in the play queue by RealMAX"
				checked={displayInfoPopups}
				onChange={(_, checked) => {
					setDisplayInfoPopups((settings.displayInfoPopups = checked));
				}}
			/>
		</LunaSettings>
	);
};
