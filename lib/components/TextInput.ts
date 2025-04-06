import { html } from "@neptune/voby";
import { DivWithTooltip } from "./divWithTooltip";

type TextInputProps = { text: string; onText?: (text: string) => void; title: string; tooltip?: string };
export const TextInput = ({ text, onText, title, tooltip }: TextInputProps) => {
	const onChange = (event: Event) => onText?.((event.target as HTMLSelectElement).value);
	return html`
		<${DivWithTooltip} tooltip=${tooltip}>
			<label for="text-${title}" style="font-size: 1.2em;margin-right: 16px;">${title}</label>
			<input
				id="text-${title}"
				value=${text}
				onChange=${onChange}
				style="flex-grow: 1; background: var(--wave-color-solid-base-brighter);border-bottom: 1px solid var(--wave-color-opacity-contrast-fill-ultra-thin);border-right: 1px solid var(--wave-color-opacity-contrast-fill-ultra-thin); color: var(--wave-color-opacity-contrast-fill-t);"
			/>
		<//>
	`;
};
