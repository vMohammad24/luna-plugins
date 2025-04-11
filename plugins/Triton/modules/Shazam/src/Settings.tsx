import { getStorage, React, TritonSetting, TritonSettings, TritonSwitch } from "@triton/lib";

export type ShzamStorage = {
	startInMiddle: boolean;
	exitOnFirstMatch: boolean;
};

export const storage = getStorage<ShzamStorage>("Shazam", {
	startInMiddle: true,
	exitOnFirstMatch: true,
});

export const Settings = () => {
	const [startInMiddle, setStartInMiddle] = React.useState(storage.startInMiddle);
	const [exitOnFirstMatch, setExitOnFirstMatch] = React.useState(storage.exitOnFirstMatch);

	return (
		<TritonSettings>
			<TritonSetting
				title="Start in middle"
				desc="Start searching in the middle of the song"
				control={
					<TritonSwitch
						checked={startInMiddle}
						onChange={(_, checked) => {
							setStartInMiddle((storage.startInMiddle = checked));
						}}
					/>
				}
			/>
			<TritonSetting
				title="Stop on first"
				desc="Stop searching on the first match"
				control={
					<TritonSwitch
						checked={exitOnFirstMatch}
						onChange={(_, checked) => {
							setExitOnFirstMatch((storage.exitOnFirstMatch = checked));
						}}
					/>
				}
			/>
		</TritonSettings>
	);
};
