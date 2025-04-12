import React from "react";

import { TritonButton, type TritonButtonProps } from "./TritonButton";
import { TritonSetting } from "./TritonSetting";
import type { TritonTitleValues } from "./TritonTitle";

export type TritonButtonSettingProps = TritonButtonProps & TritonTitleValues;

export const TritonButtonSetting = (props: TritonButtonSettingProps) => (
	<TritonSetting title={props.title} desc={props.desc}>
		<TritonButton
			{...props}
			sx={{
				marginLeft: "auto",
				marginRight: 2,
				height: 40,
				...props.sx,
			}}
			children={props.children}
		/>
	</TritonSetting>
);
