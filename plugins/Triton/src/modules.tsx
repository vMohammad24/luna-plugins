import React from "react";

import { TritonLink } from "@triton/lib";
import { type Author, TritonModule } from "./TritonModule";

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
export const coverTheme = TritonModule.fromName(
	"CoverTheme",
	{
		author: Nick,
		desc: "Theme based on the current playing song. Also adds CSS variables to be used in custom themes",
	},
	{ enabled: true }
);
export const discordRPC = TritonModule.fromName(
	"DiscordRPC",
	{
		author: Inrixia,
		desc: "Show off what you are listening to in your Discord status",
	},
	{ enabled: true }
);
export const realMax = TritonModule.fromName(
	"RealMAX",
	{
		author: Inrixia,
		desc: (
			<>
				When playing songs if there is a <b>HiRes</b> version available use that
			</>
		),
	},
	{ enabled: true }
);
export const listenBrainz = TritonModule.fromName("ListenBrainz", {
	author: Inrixia,
	desc: (
		<>
			Scrobbles and sets currently playing for{" "}
			<TritonLink fontWeight="bold" href="https://listenbrainz.org">
				listenbrainz.org
			</TritonLink>
		</>
	),
});
export const lastFM = TritonModule.fromName("LastFM", {
	author: Inrixia,
	desc: (
		<>
			Scrobbles and sets currently playing for{" "}
			<TritonLink fontWeight="bold" href="https://last.fm">
				last.fm
			</TritonLink>
		</>
	),
});
export const shazam = TritonModule.fromName("Shazam", {
	author: Inrixia,
	desc: (
		<>
			Any files you drag onto your client will be run through
			<TritonLink fontWeight="bold" href="https://www.shazam.com">
				Shazam
			</TritonLink>{" "}
			and added to the current playlist
		</>
	),
});
export const nativeFullscreen = TritonModule.fromName("NativeFullscreen", {
	author: Inrixia,
	desc: "Add F11 hotkey for fullscreen to either make the normal UI fullscreen or tidal native fullscreen in a window",
});
export const volumeScroll = TritonModule.fromName(
	"VolumeScroll",
	{
		author: Nick,
		desc: (
			<>
				Lets you scroll on the volume icon to change the volume by 10%. Can configure the step size, including different amounts for when you hold{" "}
				<b>SHIFT</b>
			</>
		),
	},
	{ enabled: true }
);
export const smallWindow = TritonModule.fromName("SmallWindow", {
	author: Nick,
	desc: "Removes the minimum width and height limits on the window. Causes some UI bugs but can be useful if you want a smaller window",
});

export const noBuffer = TritonModule.fromName("NoBuffer", {
	author: Inrixia,
	desc: "Kicks the Tidal cdn if the current playback stalls so you never have to deal with constant stuttering or stalling again",
});

export const persistSettings = TritonModule.fromName("PersistSettings", {
	author: Inrixia,
	desc: "Ensures given settings are always applied",
});

export const themer = TritonModule.fromName("Themer", {
	author: Nick,
	desc: (
		<>
			Create your own theme with a built-in CSS editor, powered by{" "}
			<TritonLink href="https://microsoft.github.io/monaco-editor">Monaco Editor</TritonLink>.
		</>
	),
});

// Dev Tools
export const devTools = TritonModule.fromName("DevTools", { author: Inrixia }, { enabled: false });
