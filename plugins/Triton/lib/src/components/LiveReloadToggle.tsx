import SensorsIcon from "@mui/icons-material/Sensors";
import SensorsOffIcon from "@mui/icons-material/SensorsOff";
import type { IconButtonProps } from "@mui/material/IconButton";
import IconButton from "@mui/material/IconButton";
import React from "react";

export interface LiveReloadToggleButtonProps extends IconButtonProps {
	enabled?: boolean;
	fetching?: boolean;
}

export const LiveReloadToggleButton = (props: LiveReloadToggleButtonProps) => {
	const [fetching, setFetching] = React.useState(false);

	React.useEffect(() => {
		if (props.fetching && !fetching) {
			setFetching(true);
		} else if (!props.fetching && fetching) {
			setTimeout(() => setFetching(false), 250);
		}
	}, [props.fetching]);

	return (
		<IconButton
			{...props}
			color={props.enabled ? "success" : "error"}
			sx={{
				animation: fetching ? "vibrate 0.25s linear infinite" : "none",
				"@keyframes vibrate": {
					"0%": { transform: "rotate(0deg) scale(1)" },
					"20%": { transform: "rotate(-4deg) scale(0.9)" },
					"40%": { transform: "rotate(0deg) scale(1)" },
					"60%": { transform: "rotate(4deg) scale(1.1)" },
					"100%": { transform: "rotate(0deg) scale(1)" },
				},
			}}
		>
			{props.enabled ? <SensorsIcon /> : <SensorsOffIcon />}
		</IconButton>
	);
};
