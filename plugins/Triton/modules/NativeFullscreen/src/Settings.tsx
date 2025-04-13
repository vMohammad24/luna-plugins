import { getStorage, React, TritonSettings, TritonSwitchSetting } from "@triton/lib";
import { setTopBarVisibility } from ".";

export const storage = getStorage("NativeFullscreen", {
	useTidalFullscreen: false,
	hideTopBar: false,
});

export const Settings = () => {
	const [useTidalFullscreen, setUseTidalFullscreen] = React.useState(storage.useTidalFullscreen);
	const [hideTopBar, setHideTopBar] = React.useState(storage.hideTopBar);
	return (
		<TritonSettings>
			<TritonSwitchSetting
				title="Use tidal fullscreen windowed"
				desc="Triggers the Tidal fullscreen mode on F11 while keeping the application windowed"
				checked={useTidalFullscreen}
				onChange={(_, checked) => setUseTidalFullscreen((storage.useTidalFullscreen = checked))}
			/>
			<TritonSwitchSetting
				title="Hide top bar"
				desc="Always hide the top application bar"
				checked={hideTopBar}
				onChange={(_, checked) => {
					setTopBarVisibility(!checked);
					setHideTopBar((storage.hideTopBar = checked));
				}}
			/>
		</TritonSettings>
	);
};
