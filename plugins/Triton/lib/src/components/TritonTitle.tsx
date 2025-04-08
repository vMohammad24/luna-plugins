import { grey } from "@mui/material/colors";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import React from "react";

type Props = { title: string; desc?: string } & TypographyProps;
export const TritonTitle = (props: Props) => (
	<>
		<Typography variant="h6">{props.title}</Typography>
		{props.desc && (
			<Typography variant="subtitle2" color={grey.A400} gutterBottom>
				{props.desc}
			</Typography>
		)}
	</>
);
