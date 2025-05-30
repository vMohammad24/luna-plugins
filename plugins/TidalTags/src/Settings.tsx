import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";
import React from "react";

export const settings = await ReactiveStore.getPluginStorage("TidalTags", {
	displayFormatBorder: true,
	displayQalityTags: true,
	displayFormatColumns: true,
});

export const Settings = () => {
	const [displayFormatBorder, setDisplayFormatBorder] = React.useState(settings.displayFormatBorder);
	const [displayQalityTags, setDisplayQalityTags] = React.useState(settings.displayQalityTags);
	const [displayFormatColumns, setDisplayFormatColumns] = React.useState(settings.displayFormatColumns);
	return (
		<LunaSettings>
			<LunaSwitchSetting
				title="Format info border"
				desc="Display a border around format Info"
				value={displayFormatBorder}
				onChange={(_, checked) => setDisplayFormatBorder((settings.displayFormatBorder = checked))}
			/>
			<LunaSwitchSetting
				title="Quality tags"
				desc="Display quality tags in the tracklist"
				value={displayQalityTags}
				onChange={(_, checked) => setDisplayQalityTags((settings.displayQalityTags = checked))}
			/>
			<LunaSwitchSetting
				title="Format columns"
				desc="Display format columns in the tracklist"
				value={displayFormatColumns}
				onChange={(_, checked) => setDisplayFormatColumns((settings.displayFormatColumns = checked))}
			/>
		</LunaSettings>
	);
};
