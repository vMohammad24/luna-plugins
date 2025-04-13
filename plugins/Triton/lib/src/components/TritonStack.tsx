import React from "react";

import Box from "@mui/material/Box";
import type { StackProps } from "@mui/material/Stack";
import Stack from "@mui/material/Stack";
import { TritonTitle, type TritonTitleValues } from "./TritonTitle";

export type TritonStackProps = StackProps & Partial<TritonTitleValues>;

export const TritonStack = (props: TritonStackProps) => {
	const { title, desc, variant } = props;
	delete props.title;
	return (
		<Box>
			{title && <TritonTitle variant={variant} title={title} desc={desc} />}
			<Stack spacing={1} {...props} />
		</Box>
	);
};
