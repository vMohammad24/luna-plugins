import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import React from "react";

import { TritonSecureText, type TritonSecureTextProps } from "./TritonSecureText";
import { TritonTitle, type TritonTitleValues } from "./TritonTitle";

export type TritonSecureTextSettingProps = TritonSecureTextProps & TritonTitleValues;
export const TritonSecureTextSetting = (props: TritonSecureTextSettingProps) => (
	<Stack direction="row" spacing={8}>
		<TritonTitle title={props.title} desc={props.desc} />
		<Box flexGrow={1}>
			<TritonSecureText sx={{ width: "100%" }} {...props} placeholder={props.title} label={null} />
		</Box>
	</Stack>
);
