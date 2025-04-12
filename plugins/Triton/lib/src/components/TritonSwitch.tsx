import React from "react";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";

import { grey } from "@mui/material/colors";

import type { SwitchProps } from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";

const darkGrey = grey[900];
const lightGrey = grey.A100;
const StyledSwitch = styled(Switch)(() => ({
	padding: 8,
	"& .MuiSwitch-switchBase": {
		"& + .MuiSwitch-track": {
			opacity: 0.5,
			backgroundColor: darkGrey,
		},
		"&.Mui-checked": {
			"& + .MuiSwitch-track": {
				opacity: 1,
				backgroundColor: lightGrey,
			},
		},
	},
	"& .MuiSwitch-track": {
		opacity: 1,
		borderRadius: 12,
	},
}));

const LoadingIcon = ({ checked, loading }: { checked?: boolean; loading?: boolean }) => (
	<Box
		style={{
			borderRadius: 12,
			marginTop: 2,
			marginLeft: 2,
			width: 16,
			height: 16,
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			backgroundColor: checked ? darkGrey : lightGrey,
		}}
	>
		{loading && <CircularProgress size={12} thickness={4} sx={{ color: checked ? lightGrey : darkGrey }} />}
	</Box>
);

export interface TritonSwitchProps extends SwitchProps {
	loading?: boolean;
	tooltip?: string;
}
export const TritonSwitch = (props: TritonSwitchProps) => (
	<Tooltip
		sx={{
			marginRight: "auto",
		}}
		title={props.tooltip ?? props.title}
	>
		<StyledSwitch
			disabled={props.loading}
			icon={<LoadingIcon loading={props.loading} />}
			checkedIcon={<LoadingIcon checked loading={props.loading} />}
			{...props}
			sx={{ marginLeft: "auto", ...props.sx }}
		/>
	</Tooltip>
);
