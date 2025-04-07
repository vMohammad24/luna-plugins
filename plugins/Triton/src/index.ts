import { intercept } from "@neptune";
import * as ReactDom from "react-dom/client";
import { TritonSettings } from "./TritonSettings";

export const Settings = () => {
	neptune.actions.modal.close();
	// @ts-expect-error Bad neptune types
	neptune.actions.router.push({
		pathname: `/not-found`,
		search: `triton`,
		replace: true,
	});
};

export const renderReact = (component: React.ReactNode, id: string) => {
	let root = document.getElementById(id);
	if (!root) {
		root = document.createElement("div");
		root.id = id;
	}
	ReactDom.createRoot(root).render(component);
	return root;
};

const root = renderReact(TritonSettings(), "TritonSettings");

export const onUnload = intercept(
	// @ts-expect-error Bad types
	"router/NAVIGATED",
	([payload]) => {
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
	}
);

// TESTING
// @ts-expect-error Bad neptune types
neptune.actions.router.push({
	pathname: `/not-found`,
	search: `triton`,
	replace: true,
});
