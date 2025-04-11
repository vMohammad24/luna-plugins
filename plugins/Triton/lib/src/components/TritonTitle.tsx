import Box from "@mui/material/Box";
import { grey } from "@mui/material/colors";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import React, { type ReactNode } from "react";

export type TritonTitleValues = {
	title: ReactNode;
	desc?: ReactNode;
};
export type TritonTitleProps = TypographyProps & TritonTitleValues;
export const TritonTitle = (props: TritonTitleProps) => (
	<Box>
		<Typography variant="h6">{props.title}</Typography>
		{props.desc && (
			<Typography variant="subtitle2" color={grey.A400} gutterBottom>
				{props.desc}
			</Typography>
		)}
	</Box>
);
