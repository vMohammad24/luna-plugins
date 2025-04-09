import React from "react";
import * as ReactDom from "react-dom/client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import { ContextMenu, safeIntercept, tritonUnloads } from "@triton/lib";

import Stack from "@mui/material/Stack";
import { TritonModule } from "./TritonModule";
import { TritonModuleSettings } from "./TritonModule.settings";

const coverTheme = TritonModule.fromName("CoverTheme");
const realMax = TritonModule.fromName("RealMAX");
coverTheme.liveReload = true;
realMax.liveReload = true;

// coverTheme.loadExports();
// realMax.loadExports();

// TESTING
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
		<Container maxWidth="md">
			<Box marginBottom={4}>
				<Typography variant="h2" sx={{ fontVariant: "small-caps" }}>
					Triton Settings
				</Typography>
				<Typography marginLeft={1} variant="subtitle1">
					Triton: the largest moon of Neptune, notable for its retrograde orbit and icy, cryovolcanically active surface.
				</Typography>
			</Box>
			<Stack spacing={4}>
				<TritonModuleSettings module={coverTheme} />
				<TritonModuleSettings module={realMax} />
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
		button.style.color = "hsl(32, 100%, 50%)";
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
		root.remove();
		if (payload.search === `?triton`) {
			setTimeout(() => {
				const notFound = document.querySelector<HTMLElement>(`[class^="_pageNotFoundError_"]`);
				if (notFound) {
					notFound.style.display = "none";
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
