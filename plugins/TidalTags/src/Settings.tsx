import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";
import React from "react";

export const settings = await ReactiveStore.getPluginStorage("TidalTags", {
	displayQalityTags: true,
	displayFormatColumns: true,
});

export const Settings = () => {
	const [displayQalityTags, setDisplayQalityTags] = React.useState(settings.displayQalityTags);
	const [displayFormatColumns, setDisplayFormatColumns] = React.useState(settings.displayFormatColumns);
	return (
		<LunaSettings>
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
