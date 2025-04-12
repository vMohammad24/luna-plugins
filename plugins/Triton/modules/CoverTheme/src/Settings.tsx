import { getStorage, React, TritonSetting, TritonSettings, TritonSwitch } from "@triton/lib";
import { style } from ".";

export const storage = getStorage("CoverTheme", {
	paletteCache: {},
	applyTheme: true,
});

export const Settings = () => {
	const [applyTheme, setApplyTheme] = React.useState(storage.applyTheme);
	return (
		<TritonSettings>
			<TritonSetting title="Enable Theme" desc="Applies the theme to the client. If disabled css variables are still available for use">
				<TritonSwitch
					tooltip={"Enable theme"}
					checked={applyTheme}
					onChange={(_, checked) => {
						setApplyTheme((storage.applyTheme = checked));
						checked ? style.add() : style.remove();
					}}
				/>
			</TritonSetting>
		</TritonSettings>
	);
};
