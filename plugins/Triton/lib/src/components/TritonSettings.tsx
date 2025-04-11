import Box from "@mui/material/Box";
import { grey } from "@mui/material/colors";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import React, { type PropsWithChildren } from "react";

export const TritonSettings = ({ children }: PropsWithChildren) => (
	<Stack
		spacing={1}
		divider={
			<Box padding={0} display="flex" justifyContent="center">
				<Divider color={grey.A400} variant="middle" sx={{ opacity: 0.25, width: "85%" }} />
			</Box>
		}
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
