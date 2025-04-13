import Box from "@mui/material/Box";
import React from "react";

import { TritonSecureText, type TritonSecureTextProps } from "./TritonSecureText";
import { TritonSetting } from "./TritonSetting";
import { type TritonTitleValues } from "./TritonTitle";

export type TritonSecureTextSettingProps = TritonSecureTextProps & TritonTitleValues;
export const TritonSecureTextSetting = (props: TritonSecureTextSettingProps) => (
	<TritonSetting spacing={8} title={props.title} desc={props.desc}>
		<Box flexGrow={1}>
			<TritonSecureText fullWidth size="small" sx={{ marginTop: 0.75 }} {...props} placeholder={props.title} label={null} />
		</Box>
	</TritonSetting>
);
