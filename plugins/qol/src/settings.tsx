import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";
import React from "react";
export const settings = await ReactiveStore.getPluginStorage("qol", {
    controllableVolume: true,
});
export const Settings = () => {
    const [controllableVolume, setControllableVolume] = React.useState(settings.controllableVolume);
    return (
        <LunaSettings>
            <LunaSwitchSetting
                title="Controllable Volume"
                desc="Enable or disable controllable volume for all your devices"
                value={controllableVolume}
                type="number"
                onChange={(_, v) => {
                    setControllableVolume(settings.controllableVolume = v);
                }}
            />
        </LunaSettings>
    );
};