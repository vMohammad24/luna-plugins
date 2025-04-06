import { getSettings, TextInput } from "@inrixia/lib";
import { html } from "@neptune/voby";

export const settings = getSettings({
	changeBy: 10,
	changeByShift: 10,
});

export const Settings = () => html`<${TextInput}
		text=${settings.changeBy}
		onText=${(text: string) => {
			const num = parseInt(text);
			if (isNaN(num)) return (settings.changeBy = 10);
			settings.changeBy = num;
		}}
		title="Percent to change volume by"
	/>
	<${TextInput}
		text=${settings.changeByShift}
		onText=${(text: string) => {
			const num = parseInt(text);
			if (isNaN(num)) return (settings.changeByShift = 10);
			settings.changeByShift = num;
		}}
		title="Percent to change volume by when shift is held"
	/>`;
