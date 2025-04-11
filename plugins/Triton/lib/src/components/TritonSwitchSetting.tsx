import React from "react";

import type { FormControlLabelProps } from "@mui/material/FormControlLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tooltip from "@mui/material/Tooltip";
import { TritonTitle, type TritonTitleValues } from "./TritonTitle";

export type TritonSettingSwitchProps = Omit<FormControlLabelProps, "label"> & TritonTitleValues;
export const TritonSetting = (props: TritonSettingSwitchProps) => (
	<FormControlLabel
		{...props}
		control={
			<Tooltip sx={{ marginRight: "auto" }} title={props.title}>
				{props.control}
			</Tooltip>
		}
		sx={{ flexGrow: 1 }}
		label={<TritonTitle title={props.title} desc={props.desc} />}
		labelPlacement="start"
	/>
);
