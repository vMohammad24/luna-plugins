import React from "react";

import type { FormControlLabelProps } from "@mui/material/FormControlLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tooltip from "@mui/material/Tooltip";
import { TritonTitle, type TritonTitleValues } from "./TritonTitle";

export type TritonSettingProps = Omit<FormControlLabelProps, "label"> & TritonTitleValues & { tooltip?: string };
export const TritonSetting = (props: TritonSettingProps) => (
	<FormControlLabel
		{...props}
		control={
			<Tooltip sx={{ marginRight: "auto" }} title={props.tooltip ?? props.title}>
				{props.control}
			</Tooltip>
		}
		sx={{ flexGrow: 1 }}
		label={<TritonTitle title={props.title} desc={props.desc} />}
		labelPlacement="start"
	/>
);
