import React from "react";

import InputAdornment from "@mui/material/InputAdornment";
import { TritonText, type TritonTextProps } from "./TritonText";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

export type TritonNumberProps = TritonTextProps & {
	min?: number;
	max?: number;
	onNumber?: (num: number) => unknown;
};

export const TritonNumber = (props: TritonNumberProps) => {
	const onNumber = (number: any) => {
		const num = +number;
		if (isNaN(num)) return;
		if (props.max !== undefined && num > props.max) return;
		if (props.min !== undefined && num < props.min) return;
		props.onNumber?.(num);
	};
	return (
		<TritonText
			slotProps={{
				input: {
					startAdornment: (
						<InputAdornment position="start">
							<RemoveIcon
								sx={{
									color: "grey",
									cursor: "pointer",
								}}
								onClick={() => onNumber(--(props.value as any))}
							/>
						</InputAdornment>
					),
					endAdornment: (
						<InputAdornment position="end">
							<AddIcon
								sx={{
									color: "grey",
									cursor: "pointer",
								}}
								onClick={() => onNumber(++(props.value as any))}
							/>
						</InputAdornment>
					),
				},
			}}
			onChange={(e) => onNumber(e.target.value)}
			inputProps={{
				style: { textAlign: "center" },
			}}
			{...props}
			sx={{
				width: 128,
				...props.sx,
			}}
		/>
	);
};
