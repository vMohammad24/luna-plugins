import Box from "@mui/material/Box";
import { grey } from "@mui/material/colors";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React, { type ComponentProps } from "react";

export const TritonStack = (props: ComponentProps<typeof Stack>) => (
	<Box>
		{props.title && (
			<Typography variant="h5" sx={{ marginBottom: 1, marginLeft: 1 }}>
				{props.title}
			</Typography>
		)}
		<Stack
			{...props}
			spacing={1}
			sx={{ boxShadow: 5, borderRadius: 3, border: 1, borderColor: "rgba(0, 0, 0, 0.20)", backgroundColor: "rgba(0, 0, 0, 0.35)", padding: 3 }}
			divider={<Divider color={grey[900]} />}
		/>
	</Box>
);
