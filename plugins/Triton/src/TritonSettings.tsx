import React from "react";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { TritonStack } from "./components/TritonStack";
import { TritonSwitch } from "./components/TritonSwitch";

export const TritonSettings = () => {
	return (
		<Container maxWidth="md">
			<Box marginBottom={4}>
				<Typography variant="h2" sx={{ fontVariant: "small-caps" }}>
					Triton Settings
				</Typography>
				<Typography marginLeft={1} variant="subtitle1">
					Settings and configuration for all plugins.
				</Typography>
			</Box>

			<Stack spacing={4}>
				<TritonStack title={"Song Downloader"}>
					<TritonSwitch title={"Normalize Volume"} desc={"Set the same volume level for all tracks."} />
					<TritonSwitch title={"Sound output"} />
				</TritonStack>
			</Stack>
		</Container>
	);
};
