import { getStorage, React, TritonSettings, TritonSwitchSetting } from "@triton/lib";

export const storage = getStorage("RealMAX", {
	displayInfoPopups: true,
});

export const Settings = () => {
	const [displayInfoPopups, setDisplayInfoPopups] = React.useState(storage.displayInfoPopups);
	return (
		<TritonSettings>
			<TritonSwitchSetting
				title="Display info popups"
				desc="Display a popup when a track is replaced in the play queue by RealMAX"
				checked={displayInfoPopups}
				onChange={(_, checked) => {
					setDisplayInfoPopups((storage.displayInfoPopups = checked));
				}}
			/>
		</TritonSettings>
	);
};
