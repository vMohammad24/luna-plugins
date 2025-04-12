import Stack from "@mui/material/Stack";
import React, { type PropsWithChildren } from "react";

export const TritonSettings = ({ children }: PropsWithChildren) => (
	<Stack
		spacing={1}
		sx={{
			borderRadius: 2,
			backgroundColor: "rgba(0, 0, 0, 0.20)",
			boxShadow: 5,
			padding: 2,
			paddingBottom: 1,
		}}
		children={children}
	/>
);
