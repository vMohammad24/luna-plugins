import { safeIntercept, type Unload } from "@triton/lib";
import { storage } from "./Settings";
export { Settings } from "./Settings";

export const unloads = new Set<Unload>();

let enterNormalFullscreen: true | undefined = undefined;
safeIntercept(
	"view/FULLSCREEN_ALLOWED",
	() => {
		if (enterNormalFullscreen || storage.useTidalFullscreen) {
			return (enterNormalFullscreen = undefined);
		}
		return true;
	},
	unloads
);
safeIntercept("view/REQUEST_FULLSCREEN", () => (enterNormalFullscreen = true), unloads);

export const setTopBarVisibility = (visible: boolean) => {
	const bar = document.querySelector<HTMLElement>("div[class^='_bar']");
	if (bar) bar.style.display = visible ? "" : "none";
};
if (storage.hideTopBar) setTopBarVisibility(false);

const onKeyDown = (event: KeyboardEvent) => {
	if (event.key === "F11") {
		event.preventDefault();

		const contentContainer = document.querySelector<HTMLElement>("div[class^='_mainContainer'] > div[class^='_containerRow']");
		const wimp = document.querySelector<HTMLElement>("#wimp > div");

		if (document.fullscreenElement || wimp?.classList.contains("is-fullscreen")) {
			// Exiting fullscreen
			document.exitFullscreen();
			if (wimp) wimp.classList.remove("is-fullscreen");
			if (!storage.hideTopBar) setTopBarVisibility(true);
			if (contentContainer) contentContainer.style.maxHeight = "";
		} else {
			// Entering fullscreen
			if (storage.useTidalFullscreen) {
				if (wimp) wimp.classList.add("is-fullscreen");
			} else {
				document.documentElement.requestFullscreen();
				setTopBarVisibility(false);
				if (contentContainer) contentContainer.style.maxHeight = `100%`;
			}
		}
	}
};

window.addEventListener("keydown", onKeyDown);
unloads.add(() => window.removeEventListener("keydown", onKeyDown));
