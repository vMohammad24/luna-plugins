import React from "react";

import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { styled } from "@mui/material/styles";

import { grey } from "@mui/material/colors";

import type { SwitchProps } from "@mui/material/Switch";
import { TritonTitle } from "./TritonTitle";

const StyledSwitch = styled(Switch)(() => ({
	padding: 8,
	"& .MuiSwitch-switchBase": {
		"&.Mui-checked": {
			color: grey[900],
			"& + .MuiSwitch-track": {
				opacity: 1,
				backgroundColor: grey.A200,
				borderRadius: 12,
			},
		},
	},
	"& .MuiSwitch-track": {
		borderRadius: 12,
		backgroundColor: grey[900],
	},
	"& .MuiSwitch-thumb": {
		color: "black",
		boxShadow: "none",
		width: 16,
		height: 16,
		margin: 2,
	},
}));

type Props = { title: string; desc?: string } & SwitchProps;
export const TritonSwitch = (props: Props) => {
	const { title, desc } = props;
	props.color ??= "default";
	return (
		<FormControlLabel
			value="bottom"
			control={<StyledSwitch {...props} sx={{ marginLeft: "auto" }} />}
			sx={{ width: "100%" }}
			label={<TritonTitle title={props.title} desc={props.desc} />}
			labelPlacement="start"
		/>
	);
};
