import Box, { type BoxProps } from "@mui/material/Box";
import { grey } from "@mui/material/colors";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import React, { type ReactNode } from "react";

export type TritonTitleValues = {
	title: ReactNode;
	desc?: ReactNode;
	variant?: TypographyProps["variant"] | "h7" | "h8" | "h9";
};
export type TritonTitleProps = BoxProps & Omit<TypographyProps, "variant"> & TritonTitleValues;
export const TritonTitle = (props: TritonTitleProps) => {
	props.variant ??= "h6";
	switch (props.variant) {
		case "h7":
			props.variant = "h6";
			props.fontSize = "1.2rem";
			break;
		case "h8":
			props.variant = "h6";
			props.fontSize = "1.075rem";
			break;
		case "h9":
			props.variant = "h6";
			props.fontSize = "1.05rem";
	}
	return (
		<Box sx={{ color: "white !important" }}>
			<Typography {...(props as TypographyProps)}>{props.title}</Typography>
			{props.desc && (
				<Typography variant="subtitle2" color={grey.A400} gutterBottom>
					{props.desc}
				</Typography>
			)}
		</Box>
	);
};
