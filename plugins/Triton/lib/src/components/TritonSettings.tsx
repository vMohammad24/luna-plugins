import React from "react";
import { TritonStack, type TritonStackProps } from "./TritonStack";

export const TritonSettings = (props: TritonStackProps) => (
	<TritonStack
		{...props}
		variant="h7"
		sx={{
			borderRadius: 2,
			backgroundColor: "rgba(0, 0, 0, 0.20)",
			boxShadow: 5,
			padding: 2,
			paddingBottom: 1,
		}}
	/>
);
