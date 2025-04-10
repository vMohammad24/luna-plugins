import { grey } from "@mui/material/colors";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import React, { type PropsWithChildren } from "react";

export const TritonSettings = ({ children }: PropsWithChildren) => (
	<Stack
		spacing={1}
		divider={<Divider color={grey[900]} sx={{ opacity: 0.25 }} />}
		sx={{
			borderRadius: 2,
			backgroundColor: "rgba(0, 0, 0, 0.20)",
			padding: 3,
		}}
		children={children}
	/>
);
