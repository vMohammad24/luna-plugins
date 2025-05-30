export const ensureColumnHeader = (trackList: Element, name: string, sourceSelector: string, beforeSelector?: string | Element) => {
	let columnHeader = trackList.querySelector<HTMLElement>(`span[data-test="${name}"][role="columnheader"]`);
	if (columnHeader !== null) return;

	const sourceColumn = trackList.querySelector(sourceSelector);
	if (!(sourceColumn instanceof HTMLElement)) return;

	columnHeader = <HTMLElement>sourceColumn.cloneNode(true);
	if ((columnHeader.firstChild?.childNodes?.length ?? -1) > 1) columnHeader.firstChild?.lastChild?.remove();
	columnHeader.setAttribute("data-test", name);
	columnHeader.firstChild!.firstChild!.textContent = name;

	return sourceColumn.parentElement!.insertBefore(
		columnHeader,
		beforeSelector instanceof Element ? beforeSelector : beforeSelector ? trackList.querySelector(beforeSelector) : sourceColumn
	);
};
