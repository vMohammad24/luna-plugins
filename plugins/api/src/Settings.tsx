import { ReactiveStore } from "@luna/core";
import { LunaSettings, LunaTextSetting } from "@luna/ui";
import { debounce } from "@mui/material";
import React from "react";
export const settings = await ReactiveStore.getPluginStorage("api", {
    port: 24123,
});
export const Settings = () => {
    const [port, setPort] = React.useState(settings.port);
    const debounceValue = React.useMemo(() => {
        return debounce((newPort: number) => {
            if (Number.isNaN(newPort) || newPort < 1 || newPort > 65535) {
                setPort(settings.port);
                return;
            }
            settings.port = newPort;
        }, 500);
    }, [port]);
    return (
        <LunaSettings>
            <LunaTextSetting
                title="API Port"
                desc="The port the API server will listen on (defaults to 24123)"
                value={port}
                type="number"
                onChange={(e) => {
                    setPort(Number(e.target.value));
                    debounceValue(Number(e.target.value));
                }}
            />
        </LunaSettings>
    );
};