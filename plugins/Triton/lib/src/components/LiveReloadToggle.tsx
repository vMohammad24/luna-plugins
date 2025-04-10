import SensorsIcon from "@mui/icons-material/Sensors";
import SensorsOffIcon from "@mui/icons-material/SensorsOff";
import type { IconButtonProps } from "@mui/material/IconButton";
import IconButton from "@mui/material/IconButton";
import React from "react";

export interface LiveReloadToggleButtonProps extends IconButtonProps {
	enabled?: boolean;
}

export const LiveReloadToggleButton = (props: LiveReloadToggleButtonProps) => (
	<IconButton {...props} color={props.enabled ? "success" : "error"}>
		{props.enabled ? <SensorsIcon /> : <SensorsOffIcon />}
	</IconButton>
);
