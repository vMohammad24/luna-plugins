import React from "react";

import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";

import { style } from ".";

export const storage = ReactiveStore.getStore("CoverTheme");
export const settings = await ReactiveStore.getPluginStorage("CoverTheme", { applyTheme: true });

export const Settings = () => {
	const [applyTheme, setApplyTheme] = React.useState(settings.applyTheme);
	return (
		<LunaSettings>
			<LunaSwitchSetting
				title="Enable Theme"
				desc="Applies the theme to the client. If disabled css variables are still available for use"
				tooltip="Enable theme"
				checked={applyTheme}
				onChange={(_, checked) => {
					setApplyTheme((settings.applyTheme = checked));
					checked ? style.add() : style.remove();
				}}
			/>
		</LunaSettings>
	);
};
