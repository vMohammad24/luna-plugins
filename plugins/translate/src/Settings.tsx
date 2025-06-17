import { ReactiveStore } from "@luna/core";
import { LunaSelectItem, LunaSelectSetting, LunaSettings, LunaSwitchSetting } from "@luna/ui";
import React from "react";
import { trace } from ".";


export const settings = await ReactiveStore.getPluginStorage("Translate", {
    targetLanguage: "en",
    alwaysTranslate: false,
});


export const languages = [
    { value: "en", label: "English", rightToLeft: false },
    { value: "es", label: "Spanish", rightToLeft: false },
    { value: "fr", label: "French", rightToLeft: false },
    { value: "de", label: "German", rightToLeft: false },
    { value: "zh-CN", label: "Chinese (Simplified)", rightToLeft: false },
    { value: "zh-TW", label: "Chinese (Traditional)", rightToLeft: false },
    { value: "ar", label: "Arabic", rightToLeft: true },
    { value: "ru", label: "Russian", rightToLeft: false },
    { value: "ja", label: "Japanese", rightToLeft: false },
    { value: "ko", label: "Korean", rightToLeft: false },
    { value: "hi", label: "Hindi", rightToLeft: false },
    { value: "pt", label: "Portuguese", rightToLeft: false },
    { value: "it", label: "Italian", rightToLeft: false },
    { value: "nl", label: "Dutch", rightToLeft: false },
    { value: "sv", label: "Swedish", rightToLeft: false },
    { value: "no", label: "Norwegian", rightToLeft: false },
    { value: "da", label: "Danish", rightToLeft: false },
    { value: "fi", label: "Finnish", rightToLeft: false },
    { value: "pl", label: "Polish", rightToLeft: false },
    { value: "uk", label: "Ukrainian", rightToLeft: false },
    { value: "vi", label: "Vietnamese", rightToLeft: false },
    { value: "th", label: "Thai", rightToLeft: false },
    { value: "tr", label: "Turkish", rightToLeft: false },
    { value: "cs", label: "Czech", rightToLeft: false },
    { value: "sk", label: "Slovak", rightToLeft: false },
    { value: "hu", label: "Hungarian", rightToLeft: false },
    { value: "el", label: "Greek", rightToLeft: false },
    { value: "he", label: "Hebrew", rightToLeft: true },
    { value: "id", label: "Indonesian", rightToLeft: false },
    { value: "ms", label: "Malay", rightToLeft: false },
    { value: "tl", label: "Filipino", rightToLeft: false },
    { value: "sw", label: "Swahili", rightToLeft: false },
    { value: "yo", label: "Yoruba", rightToLeft: false },
    { value: "zu", label: "Zulu", rightToLeft: false },
];

export const Settings = () => {
    
    const [targetLanguage, setTargetLanguage] = React.useState<string>(settings.targetLanguage);
    const onChange = React.useCallback((_: React.ChangeEvent<HTMLInputElement>, v?: {props: {value: string}}) => {
        const value = v?.props.value;
		trace.msg.log(`Language Changed to ${languages.find(lang => lang.value === value)?.label} (${value})`);
		setTargetLanguage((settings.targetLanguage = value ?? "en"));
	}, []);
    const [alwaysTranslate, setAlwaysTranslate] = React.useState<boolean>(settings.alwaysTranslate);
	return (
		<LunaSettings>
            <LunaSelectSetting title="Target Language" desc="Select the target language for translation" onChange={onChange} value={targetLanguage}>
                {languages.map(lang => (
                    <LunaSelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                    </LunaSelectItem>
                ))}
            </LunaSelectSetting>
            {/* @ts-ignore */}
            <LunaSwitchSetting title="Always Translate" checked={alwaysTranslate} desc="Always translate lyrics" onChange={(_, checked) => setAlwaysTranslate((settings.alwaysTranslate = checked))} />
		</LunaSettings>
	);
};