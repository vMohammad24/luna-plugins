import React from "react";
import { TritonSetting } from "./TritonSetting";
import { TritonSwitch, type TritonSwitchProps } from "./TritonSwitch";
import type { TritonTitleValues } from "./TritonTitle";

export type TritonSwitchSettingProps = TritonSwitchProps & TritonTitleValues;
export const TritonSwitchSetting = (props: TritonSwitchSettingProps) => (
	<TritonSetting title={props.title} desc={props.desc}>
		<TritonSwitch {...props} />
	</TritonSetting>
);
