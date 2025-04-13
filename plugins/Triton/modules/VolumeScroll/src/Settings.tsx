import { getStorage, React, TritonNumberSetting, TritonSettings } from "@triton/lib";

export const storage = getStorage("VolumeScroll", {
	changeBy: 10,
	changeByShift: 10,
});

export const Settings = () => {
	const [changeBy, setChangeBy] = React.useState(storage.changeBy);
	const [changeByShift, setChangeByShift] = React.useState(storage.changeByShift);
	return (
		<TritonSettings>
			<TritonNumberSetting
				title="Change by"
				desc="Percent to change volume by (default: 10)"
				value={changeBy}
				min={0}
				max={100}
				onNumber={setChangeBy}
			/>
			<TritonNumberSetting
				title="Change by shift"
				desc="Percent to change volume by when SHIFT is held (default: 10)"
				value={changeByShift}
				onNumber={setChangeByShift}
			/>
		</TritonSettings>
	);
};
