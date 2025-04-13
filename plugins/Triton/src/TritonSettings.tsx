import React from "react";
import * as ReactDom from "react-dom/client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import { ContextMenu, safeIntercept, tritonUnloads } from "@triton/lib";

import Stack from "@mui/material/Stack";
import { TritonModuleSettings } from "./TritonModule.settings";

import { TritonStack } from "../lib/src/components/TritonStack";
import {
	coverTheme,
	devTools,
	discordRPC,
	lastFM,
	listenBrainz,
	nativeFullscreen,
	noBuffer,
	persistSettings,
	realMax,
	shazam,
	smallWindow,
	themer,
	volumeScroll,
} from "./modules";

// TODO: REMOVE this is for testing only
setTimeout(
	() =>
		// @ts-expect-error TESTING
		neptune.actions.router.push({
			pathname: `/not-found`,
			search: `triton`,
			replace: true,
		}),
	250
);

const TritonSettings = async () => {
	return (
		<Container maxWidth="md" sx={{ marginBottom: 10 }}>
			<Box marginBottom={4}>
				<Typography variant="h2" sx={{ fontVariant: "small-caps" }}>
					Triton Settings
				</Typography>
				<Typography marginLeft={1} variant="subtitle1">
					Triton is the largest moon of Neptune, notable for its retrograde orbit and icy, cryovolcanically active surface.
				</Typography>
			</Box>
			<Stack spacing={2}>
				<TritonStack variant="h5" title="Main" desc="Core functionality of Triton">
					<TritonModuleSettings module={coverTheme} />
					<TritonModuleSettings module={realMax} />
				</TritonStack>

				<TritonStack variant="h5" title="Scrobbling" desc="Scrobblers for saving & sharing listen history & currently listening">
					<TritonModuleSettings module={discordRPC} />
					<TritonModuleSettings module={lastFM} />
					<TritonModuleSettings module={listenBrainz} />
				</TritonStack>

				<TritonStack variant="h5" title="Tweaks" desc="A collection of tweaks and improvements to the tidal client">
					<TritonModuleSettings module={noBuffer} />
					<TritonModuleSettings module={volumeScroll} />
					<TritonModuleSettings module={nativeFullscreen} />
					<TritonModuleSettings module={smallWindow} />
					<TritonModuleSettings module={persistSettings} />
					<TritonModuleSettings module={themer} />
					<TritonModuleSettings module={shazam} />
				</TritonStack>

				<TritonStack variant="h5" title="_DEV.Tools" desc="Various developer tools for working with Neptune">
					<TritonModuleSettings module={devTools} />
				</TritonStack>
			</Stack>
		</Container>
	);
};

ContextMenu.onOpen(({ event, contextMenu }) => {
	if (event.type === "USER_PROFILE") {
		const button = contextMenu.addButton("Triton Settings", () => {
			// @ts-expect-error Neptune types bad
			neptune.actions.router.push({
				pathname: `/not-found`,
				search: `triton`,
				replace: true,
			});
		});
		button.style.fontSize = "14px";
		button.classList.add("glow-on-hover");
	}
});

const rootId = "TritonSettings";
const root = document.getElementById(rootId) ?? document.createElement("div");
tritonUnloads.add(root.remove.bind(root));
root.id = rootId;
ReactDom.createRoot(root).render(TritonSettings());

// Intercept when navigating to ?triton and overwrite the pageNotFound with Triton's react settings page
safeIntercept<{ search: string }>(
	"router/NAVIGATED",
	(payload) => {
		if (root.parentElement) root.parentElement.style.background = "";
		root.remove();
		if (payload.search === `?triton`) {
			setTimeout(() => {
				const notFound = document.querySelector<HTMLElement>(`[class^="_pageNotFoundError_"]`);
				if (notFound) {
					notFound.style.display = "none";
					// thx @n1ckoates re CoverTheme <3
					notFound.parentElement!.style.background = `
					radial-gradient(ellipse at top left, rgba(88, 10, 82, 0.5), transparent 70%),
					radial-gradient(ellipse at center left, rgba(18, 234, 246, 0.5), transparent 70%),
					radial-gradient(ellipse at bottom left, rgba(205, 172, 191, 0.5), transparent 70%),
					radial-gradient(ellipse at top right, rgba(139, 203, 235, 0.5), transparent 70%),
					radial-gradient(ellipse at center right, rgba(98, 103, 145, 0.5), transparent 70%),
					radial-gradient(ellipse at bottom right, rgba(47, 48, 78, 0.5), transparent 70%)`;
					notFound.insertAdjacentElement("afterend", root);
				}
			});
		}
	},
	tritonUnloads
);
export const Settings = () => {
	neptune.actions.modal.close();
	// @ts-expect-error Bad neptune types
	neptune.actions.router.push({
		pathname: `/not-found`,
		search: `triton`,
		replace: true,
	});
};
