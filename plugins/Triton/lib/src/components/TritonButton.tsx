import React from "react";

import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { grey } from "@mui/material/colors";
import Tooltip from "@mui/material/Tooltip";

export type TritonButtonProps = ButtonProps & {
	tooltip?: string;
};

export const TritonButton = (props: TritonButtonProps) => {
	return (
		<Tooltip sx={{ marginRight: "auto" }} title={props.tooltip ?? props.title}>
			<Button
				loadingIndicator={<CircularProgress color="warning" size={16} />}
				variant={props.variant ?? "contained"}
				children={props.children}
				{...props}
				sx={{
					backgroundColor: grey[900],
					color: grey.A200,
					...props.sx,
				}}
			/>
		</Tooltip>
	);
};
