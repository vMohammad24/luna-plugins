import { ReactiveStore } from "@luna/core";
import { LunaSelectItem, LunaSelectSetting, LunaSettings, LunaSwitchSetting, LunaTextSetting } from "@luna/ui";
import React from "react";
import { AudioDevice, getAvailableAudioDevices, updateMpvNativeSettings, updatePlayerProperties } from "./index.native";

export const settings = await ReactiveStore.getPluginStorage<{
    mpvPath?: string;
    audioDevice?: string;
    audioExclusive?: boolean;
    gaplessAudio?: boolean;
    customArgs?: string;
}>("mpv", {
    mpvPath: undefined,
    audioDevice: "auto",
    audioExclusive: false,
    gaplessAudio: true,
    customArgs: ""
});

export const Settings = () => {
    const [mpvPath, setMpvPath] = React.useState<string | undefined>(settings.mpvPath);
    const [audioDevice, setAudioDevice] = React.useState<string>(settings.audioDevice || "auto");
    const [audioExclusive, setAudioExclusive] = React.useState<boolean>(settings.audioExclusive || false);
    const [gaplessAudio, setGaplessAudio] = React.useState<boolean>(settings.gaplessAudio !== false);
    const [customArgs, setCustomArgs] = React.useState<string>(settings.customArgs || "");

    const [audioDevices, setAudioDevices] = React.useState<AudioDevice[]>([]);
    const [loadingDevices, setLoadingDevices] = React.useState<boolean>(false);

    React.useEffect(() => {
        async function loadAudioDevices() {
            setLoadingDevices(true);
            try {
                const devices = await getAvailableAudioDevices(mpvPath);
                setAudioDevices(devices);
            } catch (err) {
                console.error('Failed to load audio devices:', err);
            }
            setLoadingDevices(false);
        }
        loadAudioDevices();
    }, [mpvPath]);

    React.useEffect(() => {
        settings.mpvPath = mpvPath;

        updateMpvNativeSettings({
            mpvPath
        });
    }, [mpvPath]);

    React.useEffect(() => {
        const properties: Record<string, any> = {};

        if (audioDevice && audioDevice !== "auto") {
            properties['audio-device'] = audioDevice;
        }

        if (audioExclusive) {
            properties['audio-exclusive'] = 'yes';
        } else {
            properties['audio-exclusive'] = 'no';
        }

        if (gaplessAudio) {
            properties['gapless-audio'] = 'yes';
        } else {
            properties['gapless-audio'] = 'no';
        }

        if (customArgs.trim()) {
            const customArgsArray = customArgs.trim().split(/\s+/).filter(arg => arg.length > 0);
            for (const arg of customArgsArray) {
                if (arg.startsWith('--')) {
                    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
                    if (match) {
                        const [, key, value] = match;
                        properties[key] = value || 'yes';
                    }
                }
            }
        }

        Object.assign(settings, {
            audioDevice, audioExclusive, gaplessAudio, customArgs
        });

        if (Object.keys(properties).length > 0) {
            updatePlayerProperties(properties);
        }
    }, [audioDevice, audioExclusive, gaplessAudio, customArgs]);

    return (
        <LunaSettings>
            <LunaTextSetting
                title="MPV Path"
                value={mpvPath || ""}
                onChange={(event) => {
                    const value = event.target.value || undefined;
                    setMpvPath((settings.mpvPath = value));
                }}
            />

            <LunaSelectSetting
                title="Audio Device"
                value={audioDevice}
                onChange={(event) => {
                    const value = event.target.value;
                    setAudioDevice((settings.audioDevice = value));
                }}
            >
                {loadingDevices ? (
                    <LunaSelectItem value="auto">Loading devices...</LunaSelectItem>
                ) : (
                    audioDevices.map(device => (
                        <LunaSelectItem key={device.id} value={device.id}>
                            {device.description}
                        </LunaSelectItem>
                    ))
                )}
            </LunaSelectSetting>

            <LunaSwitchSetting
                title="Exclusive Audio"
                value={audioExclusive}
                onChange={(_, checked) => {
                    setAudioExclusive((settings.audioExclusive = checked));
                }}
            />

            <LunaSwitchSetting
                title="Gapless Audio"
                value={gaplessAudio}
                onChange={(_, checked) => {
                    setGaplessAudio((settings.gaplessAudio = checked));
                }}
            />

            <LunaTextSetting
                title="Advanced: Custom Arguments"
                value={customArgs}
                placeholder="--cache=yes --demuxer-max-bytes=100M"
                onChange={(event) => {
                    const value = event.target.value;
                    setCustomArgs((settings.customArgs = value));
                }}
            />
        </LunaSettings>
    );
};