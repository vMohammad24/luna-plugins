import { LunaButtonSetting, LunaLink, LunaSettings } from "@luna/ui";
import React from "react";
import { openEditor } from ".";

export const Settings = () => (
	<LunaSettings>
		<LunaButtonSetting
			title="CSS Editor"
			desc={
				<>
					Click the button or press <b>CTRL</b> + <b>E</b> to open the{" "}
					<LunaLink href="https://microsoft.github.io/monaco-editor" children="Monaco Editor" />
				</>
			}
			onClick={openEditor}
			children="Open Editor"
		/>
	</LunaSettings>
);
