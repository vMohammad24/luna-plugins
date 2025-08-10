import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";
import React from "react";
import { updateNoTrackNativeSettings } from "./index.native";

export const settings = await ReactiveStore.getPluginStorage("noTrack", {
    disableSentry: true,
    disableEventBatch: false
});




export const Settings = () => {

    const [disableSentry, setDisableSentry] = React.useState<boolean>(settings.disableSentry);
    const [disableEventBatch, setDisableEventBatch] = React.useState<boolean>(settings.disableEventBatch);
    React.useEffect(() => {
        updateNoTrackNativeSettings({
            disableSentry,
            disableEventBatch
        })
    }, [disableSentry, disableEventBatch]);
    return (
        <LunaSettings>
            <LunaSwitchSetting title="Disable Sentry" checked={disableSentry} desc="Disable Sentry error tracking" onChange={(_, checked) => setDisableSentry((settings.disableSentry = checked))} />
            <LunaSwitchSetting title="Disable Event Batch" checked={disableEventBatch} desc="Disable event batching" onChange={(_, checked) => setDisableEventBatch((settings.disableEventBatch = checked))} />
        </LunaSettings>
    );
};