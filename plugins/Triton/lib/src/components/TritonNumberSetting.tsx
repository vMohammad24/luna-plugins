import React from "react";

import { TritonNumber, type TritonNumberProps } from "./TritonNumber";
import { TritonSetting } from "./TritonSetting";
import { type TritonTitleValues } from "./TritonTitle";

export type TritonNumberSettingProps = TritonNumberProps & TritonTitleValues;
export const TritonNumberSetting = (props: TritonNumberSettingProps) => (
	<TritonSetting title={props.title} desc={props.desc}>
		<TritonNumber size="small" sx={{ marginLeft: "auto" }} {...props} placeholder={props.title} label={null} />
	</TritonSetting>
);
