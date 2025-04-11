import * as React from "react";

import { LiveReloadToggleButton, ReloadButton, TritonSwitch, unloadSet } from "@triton/lib";

import type { TritonModule } from "./TritonModule";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

export const TritonModuleSettings = ({ module }: { module: TritonModule }) => {
	// Have to wrap in function call as Settings is a functional component
	const [Settings, setSettings] = React.useState(() => module.Settings._);
	const [enabled, setEnabled] = React.useState(module.enabled);
	const [loading, setLoading] = React.useState(true);
	const [liveReload, setLiveReload] = React.useState(module.liveReload._);
	const [loadError, setLoadError] = React.useState(module.loadError._);

	React.useEffect(() => {
		const unloads = new Set([
			module.Settings.onValue((next) => setSettings(() => next)),
			module.loading.onValue((next) => setLoading(next)),
			module.liveReload.onValue((next) => setLiveReload(next)),
			module.loadError.onValue((next) => setLoadError(next)),
			module.onEnabled((next) => setEnabled(next)),
		]);
		return () => {
			unloadSet(unloads);
		};
	}, []);

	const disabled = !enabled || loading;

	return (
		<Stack
			spacing={1}
			sx={{
				boxShadow: 5,
				borderRadius: 3,
				backgroundColor: "rgba(0, 0, 0, 0.35)",
				border: loadError ? "2px solid rgba(255, 0, 0, 0.45)" : null,
				padding: 2,
			}}
		>
			<Stack direction="row" spacing={1}>
				<FormControlLabel
					control={
						<Tooltip title={enabled ? `Disable ${module.name}` : `Enable ${module.name}`}>
							<TritonSwitch loading={loading} />
						</Tooltip>
					}
					label={
						<Typography sx={{ marginTop: 0.2 }} variant="h6">
							{module.name}
						</Typography>
					}
					labelPlacement="start"
					checked={enabled}
					onChange={(_, checked) => {
						checked ? module.enable() : module.disable();
					}}
				/>
				<Tooltip title="Reload module">
					<ReloadButton spin={loading} disabled={disabled} onClick={module.reload.bind(module)} />
				</Tooltip>
				<Tooltip title={liveReload ? "Disable live reloading" : "Enable live reloading"}>
					<LiveReloadToggleButton disabled={disabled} enabled={liveReload} sx={{ marginLeft: 1 }} onClick={() => (module.liveReload._ = !module.liveReload._)} />
				</Tooltip>
				{loadError && (
					<Typography
						variant="caption"
						sx={{
							color: "white",
							fontWeight: 500,
							backgroundColor: "rgba(255, 0, 0, 0.5)",
							padding: 1,
							borderRadius: 1,
							boxShadow: 3,
							paddingTop: 1.5,
						}}
					>
						Error loading: {loadError}
					</Typography>
				)}
				<Box sx={{ flexGrow: 1 }} /> {/* This pushes the author section to the right */}
				<Tooltip title={`Visit ${module.author.name}'s profile`}>
					<Stack
						direction="row"
						spacing={1}
						alignItems="center"
						onClick={() => {
							window.open(module.author.url, "_blank");
						}}
						sx={{ cursor: "pointer" }}
					>
						<Typography sx={{ fontWeight: 500, paddingTop: 0.2 }}>
							<Typography variant="caption" style={{ opacity: 0.7 }}>
								by{" "}
							</Typography>
							{module.author.name}
						</Typography>
						{module.author.avatarUrl && (
							<Avatar
								src={module.author.avatarUrl}
								sx={{
									width: 28,
									height: 28,
								}}
							/>
						)}
					</Stack>
				</Tooltip>
			</Stack>

			{Settings && <Settings />}
		</Stack>
	);
};
