import React from "react";

import Link, { type LinkProps } from "@mui/material/Link";

export interface TritonLinkProps extends LinkProps {}
export const TritonLink = (props: TritonLinkProps) => {
	const href = props.href ?? (typeof props.children === "string" ? props.children : undefined);
	return (
		<Link
			{...props}
			sx={{
				textDecoration: "none !important",
			}}
			href={href}
			target={"_blank"}
		/>
	);
};
