import React from "react";

import { TritonSetting } from "./TritonSetting";
import { TritonText, type TritonTextProps } from "./TritonText";
import { type TritonTitleValues } from "./TritonTitle";

export type TritonTextSettingProps = TritonTextProps & TritonTitleValues;
export const TritonTextSetting = (props: TritonTextSettingProps) => (
	<TritonSetting title={props.title} desc={props.desc}>
		<TritonText sx={{ flexGrow: 1, height: "80%", marginTop: 0.25 }} {...props} placeholder={props.title} label={null} />
	</TritonSetting>
);
