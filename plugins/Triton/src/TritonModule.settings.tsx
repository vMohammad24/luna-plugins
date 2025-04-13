import * as React from "react";

import { LiveReloadToggleButton, ReloadButton, TritonSwitch, unloadSet } from "@triton/lib";

import type { TritonModule } from "./TritonModule";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { grey } from "@mui/material/colors";

export const TritonModuleSettings = ({ module }: { module: TritonModule }) => {
	// Have to wrap in function call as Settings is a functional component
	const [Settings, setSettings] = React.useState(() => module.Settings._);
	const [enabled, setEnabled] = React.useState(module.enabled);
	const [loading, setLoading] = React.useState(true);
	const [liveReload, setLiveReload] = React.useState(module.liveReload._);
	const [fetching, setFetching] = React.useState(module.fetching._);
	const [loadError, setLoadError] = React.useState(module.loadError._);

	React.useEffect(() => {
		const unloads = new Set([
			module.Settings.onValue((next) => setSettings(() => next)),
			module.loading.onValue((next) => setLoading(next)),
			module.liveReload.onValue((next) => setLiveReload(next)),
			module.fetching.onValue((next) => setFetching(next)),
			module.loadError.onValue((next) => setLoadError(next)),
			module.onEnabled((next) => setEnabled(next)),
		]);
		return () => {
			unloadSet(unloads);
		};
	}, []);

	const disabled = !enabled || loading;

	const author = module.info.author;
	const desc = module.info.desc;

	return (
		<Stack
			spacing={1}
			sx={{
				borderRadius: 3,
				backgroundColor: "rgba(0, 0, 0, 0.10)",
				boxShadow: loadError ? "0 0 10px rgba(255, 0, 0, 0.70)" : "none",
				padding: 2,
				paddingTop: 1,
				paddingBottom: Settings ? 2 : 1,
			}}
		>
			<Box>
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
					<Tooltip title={liveReload ? "Disable live reloading" : "Enable live reloading (for development)"}>
						<LiveReloadToggleButton
							disabled={disabled}
							enabled={liveReload}
							fetching={fetching}
							sx={{ marginLeft: 1 }}
							onClick={() => (module.liveReload._ = !module.liveReload._)}
						/>
					</Tooltip>
					{loadError && (
						<Typography
							variant="caption"
							sx={{
								color: "white",
								fontWeight: 500,
								backgroundColor: "rgba(256, 0, 0, 0.5)",
								padding: 1,
								borderRadius: 1,
								paddingTop: 1.5,
							}}
						>
							{loadError}
						</Typography>
					)}
					<Box sx={{ flexGrow: 1 }} /> {/* This pushes the author section to the right */}
					<Tooltip title={`Visit ${author.name}'s profile`}>
						<Stack
							direction="row"
							spacing={1}
							alignItems="center"
							onClick={() => {
								window.open(author.url, "_blank");
							}}
							sx={{ cursor: "pointer" }}
						>
							<Typography sx={{ fontWeight: 500, paddingTop: 0.2 }}>
								<Typography variant="caption" style={{ opacity: 0.7 }}>
									by{" "}
								</Typography>
								{author.name}
							</Typography>
							{author.avatarUrl && (
								<Avatar
									src={author.avatarUrl}
									sx={{
										width: 28,
										height: 28,
									}}
								/>
							)}
						</Stack>
					</Tooltip>
				</Stack>
				{desc && (
					<Typography variant="subtitle2" color={grey.A400} gutterBottom>
						{desc}
					</Typography>
				)}
			</Box>

			{Settings && <Settings />}
		</Stack>
	);
};
