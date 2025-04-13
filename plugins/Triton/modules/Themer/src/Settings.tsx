import { React, TritonButtonSetting, TritonLink, TritonSettings } from "@triton/lib";
import { openEditor } from ".";

export const Settings = () => (
	<TritonSettings>
		<TritonButtonSetting
			title="CSS Editor"
			desc={
				<>
					Click the button or press <b>CTRL</b> + <b>E</b> to open the{" "}
					<TritonLink href="https://microsoft.github.io/monaco-editor">Monaco Editor</TritonLink>
				</>
			}
			onClick={openEditor}
		>
			Open Editor
		</TritonButtonSetting>
	</TritonSettings>
);
