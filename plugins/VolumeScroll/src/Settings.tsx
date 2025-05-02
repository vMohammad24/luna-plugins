import { ReactiveStore } from "@luna/core";
import { LunaNumberSetting, LunaSettings } from "@luna/ui";
import React from "react";

export const storage = await ReactiveStore.getPluginStorage("VolumeScroll", {
	changeBy: 10,
	changeByShift: 1,
});

export const Settings = () => {
	const [changeBy, setChangeBy] = React.useState(storage.changeBy);
	const [changeByShift, setChangeByShift] = React.useState(storage.changeByShift);
	return (
		<LunaSettings>
			<LunaNumberSetting
				title="Change by"
				desc="Percent to change volume by (default: 10)"
				value={changeBy}
				min={0}
				max={100}
				onNumber={(num) => setChangeBy((storage.changeBy = num))}
			/>
			<LunaNumberSetting
				title="Change by shift"
				desc="Percent to change volume by when SHIFT is held (default: 1)"
				value={changeByShift}
				onNumber={(num) => setChangeByShift((storage.changeByShift = num))}
			/>
		</LunaSettings>
	);
};
