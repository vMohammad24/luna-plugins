import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaSwitchSetting } from "@luna/ui";
import React from "react";
import { updateNoTrackNativeSettings } from "./index.native";

export const settings = await ReactiveStore.getPluginStorage("noTrack", {
    disableSentry: true,
    disableEventBatch: false,
    disableDataDome: false,
});




export const Settings = () => {

    const [disableSentry, setDisableSentry] = React.useState<boolean>(settings.disableSentry);
    const [disableEventBatch, setDisableEventBatch] = React.useState<boolean>(settings.disableEventBatch);
    const [disableDataDome, setDisableDataDome] = React.useState<boolean>(settings.disableDataDome);
    React.useEffect(() => {
        updateNoTrackNativeSettings({
            disableSentry,
            disableEventBatch,
            disableDataDome
        })
    }, [disableSentry, disableEventBatch, disableDataDome]);
    return (
        <LunaSettings>
            <LunaSwitchSetting title="Disable Sentry" checked={disableSentry} desc="Disable Sentry error tracking" onChange={(_, checked) => setDisableSentry((settings.disableSentry = checked))} />
            <LunaSwitchSetting title="Disable Event Batch" checked={disableEventBatch} desc="Disable event batching" onChange={(_, checked) => setDisableEventBatch((settings.disableEventBatch = checked))} />
            <LunaSwitchSetting title="Disable DataDome" checked={disableDataDome} desc="Disable DataDome bot protection" onChange={(_, checked) => setDisableDataDome((settings.disableDataDome = checked))} />
        </LunaSettings>
    );
};