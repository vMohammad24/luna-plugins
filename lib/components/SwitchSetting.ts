import { html } from "@neptune/voby";
import { DivWithTooltip } from "./divWithTooltip";

type SwitchSettingProps = { checked: boolean; onClick?: () => void; title: string; tooltip?: string };
export const SwitchSetting = ({ checked, onClick, title, tooltip }: SwitchSettingProps) => {
	checked ??= false;
	return html`
		<${DivWithTooltip} tooltip=${tooltip}>
			<label for="switch-${title}" style="font-size: 1.2em;margin-bottom: 5px;">${title}</label>
			<input id="switch-${title}" class="neptune-switch-checkbox" type="checkbox" checked=${checked} />
			<span onClick=${onClick} class="neptune-switch" />
		<//>
	`;
};
