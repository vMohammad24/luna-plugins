import React from "react";

import Stack, { type StackProps } from "@mui/material/Stack";
import { TritonTitle, type TritonTitleValues } from "./TritonTitle";

export type TritonSettingProps = StackProps & TritonTitleValues;
export const TritonSetting = (props: TritonSettingProps) => (
	<Stack direction="row" {...props} title={undefined} sx={{ flexGrow: 1 }}>
		<TritonTitle title={props.title} desc={props.desc} />
		{props.children}
	</Stack>
);
