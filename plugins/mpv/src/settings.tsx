import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaTextSetting } from "@luna/ui";
import React from "react";
import { updateMpvNativeSettings } from "./index.native";

export const settings = await ReactiveStore.getPluginStorage<{
    mpvPath?: string;
}>("mpv", {
    mpvPath: undefined
});




export const Settings = () => {

    const [mpvPath, setMpvPath] = React.useState<string | undefined>(settings.mpvPath);
    React.useEffect(() => {
        updateMpvNativeSettings({
            mpvPath
        })
    }, [mpvPath]);
    return (
        <LunaSettings>
            <LunaTextSetting
                title="MPV Path"
                value={mpvPath}
                onChange={(event) => {
                    const value = event.target.value;
                    setMpvPath((settings.mpvPath = value));
                }}
            />
        </LunaSettings>
    );
};