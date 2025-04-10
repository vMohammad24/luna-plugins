import CachedIcon from "@mui/icons-material/Cached";
import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
import React, { useEffect, useState } from "react";

interface ReloadButtonProps extends IconButtonProps {
	spin?: boolean;
}

export const ReloadButton = ({ spin, ...props }: ReloadButtonProps) => {
	const [isSpinning, setIsSpinning] = useState(false);

	useEffect(() => {
		if (spin && !isSpinning) {
			setIsSpinning(true);
		} else if (!spin && isSpinning) {
			setTimeout(() => setIsSpinning(false), 500);
		}
	}, [spin]);

	return (
		<IconButton {...props} color="warning">
			<CachedIcon
				sx={{
					animation: isSpinning ? "spin 0.5s linear infinite" : "none",
					"@keyframes spin": {
						"0%": { transform: "rotate(0deg)" },
						"100%": { transform: "rotate(360deg)" },
					},
				}}
			/>
		</IconButton>
	);
};
