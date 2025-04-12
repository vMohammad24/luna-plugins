import React from "react";
import * as ReactDom from "react-dom/client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import { ContextMenu, safeIntercept, tritonUnloads } from "@triton/lib";

import Stack from "@mui/material/Stack";
import { TritonModule, type Author } from "./TritonModule";
import { TritonModuleSettings } from "./TritonModule.settings";

const Inrixia: Author = {
	name: "Inrixia",
	url: "https://github.com/Inrixia",
	avatarUrl: "https://2.gravatar.com/avatar/eeaffef9eb9b436dccc58c6c44c9fe8c3528e83e3bf64e1c736a68dbe8c097d3",
};
const Nick: Author = {
	name: "Nick Oates",
	url: "https://github.com/n1ckoates",
	avatarUrl: "https://1.gravatar.com/avatar/665fef45b1c988d52f011b049b99417485b9b558947169bc4b726b8eb69a2226",
};

const coverTheme = TritonModule.fromName("CoverTheme", Nick);
const discordRPC = TritonModule.fromName("DiscordRPC", Inrixia);
const realMax = TritonModule.fromName("RealMAX", Inrixia);
const listenBrainz = TritonModule.fromName("ListenBrainz", Inrixia, { enabled: false });
const lastFM = TritonModule.fromName("LastFM", Inrixia, { enabled: false });
const shazam = TritonModule.fromName("Shazam", Inrixia, { enabled: false });

// Dev Tools
const devTools = TritonModule.fromName("DevTools", Inrixia, { enabled: false });

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
				<TritonModuleSettings module={coverTheme} />
				<TritonModuleSettings module={discordRPC} />
				<TritonModuleSettings module={realMax} />
				<TritonModuleSettings module={listenBrainz} />
				<TritonModuleSettings module={lastFM} />
				<TritonModuleSettings module={shazam} />
				<TritonModuleSettings module={devTools} />
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
					notFound.parentElement!.style.background = "linear-gradient(to right, rgba(134, 71, 115, 0.6), rgba(255, 25, 121, 0.6)";
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
