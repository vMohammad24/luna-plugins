import React from "react";
import * as ReactDom from "react-dom/client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { safeIntercept, TritonStack, tritonUnloads } from "@triton/lib";

import { TritonModule } from "./TritonModule";
import { TritonModuleSettings } from "./TritonModule.settings";

const coverTheme = TritonModule.fromName("CoverTheme");
coverTheme.liveReload = true;

await coverTheme.loadExports();

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
				<TritonStack title={"CoverTheme"}>
					<TritonModuleSettings module={coverTheme} />
				</TritonStack>
			</Stack>
		</Container>
	);
};

const rootId = "TritonSettings";
const root = document.getElementById(rootId) ?? document.createElement("div");
tritonUnloads.add(root.remove);
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
