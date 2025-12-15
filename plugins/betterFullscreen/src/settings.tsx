import { ReactiveStore } from "@luna/core";
import {
    LunaButtonSetting,
    LunaSelectItem,
    LunaSelectSetting,
    LunaSettings,
    LunaSwitchSetting,
    LunaTextSetting,
} from "@luna/ui";
import React from "react";
import { trace } from ".";

const THEME_PREVIEWS: Record<StyleTheme, { name: string; gradient: string; accent: string }> = {
    Modern: {
        name: "Modern",
        gradient: "linear-gradient(135deg, rgba(100, 50, 150, 0.3), rgba(50, 100, 200, 0.3))",
        accent: "#8b5cf6"
    },
    Minimal: {
        name: "Minimal",
        gradient: "linear-gradient(180deg, rgba(10, 10, 15, 0.5), rgba(0, 0, 0, 0.7))",
        accent: "#9ca3af"
    },
    Cinematic: {
        name: "Cinematic",
        gradient: "linear-gradient(180deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 20, 0.9))",
        accent: "#ffffff"
    },
    Neon: {
        name: "Neon",
        gradient: "linear-gradient(135deg, rgba(138, 0, 138, 0.4), rgba(0, 138, 138, 0.4))",
        accent: "#ff00ff"
    },
    Glass: {
        name: "Glass",
        gradient: "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
        accent: "#60a5fa"
    },
    Retro: {
        name: "Retro",
        gradient: "linear-gradient(135deg, rgba(80, 60, 40, 0.5), rgba(40, 30, 20, 0.7))",
        accent: "#fbbf24"
    }
};

const ThemePreviewCard = ({
    theme,
    isSelected,
    onClick
}: {
    theme: StyleTheme;
    isSelected: boolean;
    onClick: () => void;
}) => {
    const preview = THEME_PREVIEWS[theme];

    return (
        <div
            onClick={onClick}
            style={{
                position: 'relative',
                cursor: 'pointer',
                borderRadius: '12px',
                overflow: 'hidden',
                background: preview.gradient,
                border: isSelected ? `3px solid ${preview.accent}` : '2px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                aspectRatio: '16/9',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '16px',
                boxShadow: isSelected
                    ? `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px ${preview.accent}, 0 0 20px ${preview.accent}40`
                    : '0 4px 12px rgba(0, 0, 0, 0.2)',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                backdropFilter: theme === 'Glass' ? 'blur(10px)' : 'none'
            }}
            onMouseEnter={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.borderColor = preview.accent;
                }
            }}
            onMouseLeave={(e) => {
                if (!isSelected) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }
            }}
        >
            { }
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40px',
                height: '40px',
                borderRadius: theme === 'Retro' ? '50%' : '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: theme === 'Neon'
                    ? `0 0 20px ${preview.accent}`
                    : '0 4px 8px rgba(0, 0, 0, 0.2)'
            }} />

            { }
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80%',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                alignItems: 'center'
            }}>
                <div style={{
                    height: '4px',
                    width: '60%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '2px'
                }} />
                <div style={{
                    height: '6px',
                    width: '80%',
                    background: preview.accent,
                    borderRadius: '3px',
                    boxShadow: theme === 'Neon' || theme === 'Modern'
                        ? `0 0 10px ${preview.accent}`
                        : 'none'
                }} />
                <div style={{
                    height: '4px',
                    width: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '2px'
                }} />
            </div>

            { }
            <div style={{
                position: 'relative',
                zIndex: 1,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                padding: '10px 12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: isSelected ? preview.accent : '#fff',
                    textShadow: theme === 'Neon' ? `0 0 8px ${preview.accent}` : 'none',
                    textAlign: 'center'
                }}>
                    {preview.name}
                </div>
            </div>

            { }
            {isSelected && (
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: preview.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 12px ${preview.accent}`,
                    color: theme === 'Minimal' || theme === 'Glass' || theme === 'Cinematic' ? '#000' : '#fff',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }}>
                    ✓
                </div>
            )}
        </div>
    );
};

const ThemePreviewGrid = ({
    currentTheme,
    onThemeSelect
}: {
    currentTheme: StyleTheme;
    onThemeSelect: (theme: StyleTheme) => void;
}) => {
    const themes: StyleTheme[] = ['Modern', 'Minimal', 'Cinematic', 'Neon', 'Glass', 'Retro'];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            {themes.map(theme => (
                <ThemePreviewCard
                    key={theme}
                    theme={theme}
                    isSelected={currentTheme === theme}
                    onClick={() => onThemeSelect(theme)}
                />
            ))}
        </div>
    );
};

const defaultValues = {
    syncLevel: "Word" as SyncMode,
    apiURL: "https://api.vmohammad.dev/lyrics/?tidal_id=%s&minimal=true",
    fullscreenButton: true,
    catJam: "None" as CatJam,
    styleTheme: "Modern" as StyleTheme,
    showLyricProgress: false,
    lyricsOffset: 0,
    backgroundBlur: 25,
    vibrantColorOpacity: 0.4,
    textShadowIntensity: 1.0,
    animationSpeed: 1.0,
    enableFloatingAnimation: true,
    enablePulseEffects: true,
    fontSizeScale: 1.0,
    textOpacity: 1.0,
    paddingScale: 1.0,
    borderRadius: 12,
    customVibrantColor: "",
    currentLyricColor: "",
};
export const settings = await ReactiveStore.getPluginStorage(
    "BetterFullScreen",
    defaultValues,
);

type SyncMode = "Line" | "Word" | "Character";
type CatJam = "CatJam" | "CatRave" | "CatRave2" | "None";
export type StyleTheme = "Modern" | "Minimal" | "Cinematic" | "Neon" | "Glass" | "Retro";



export const Settings = () => {
    const [currentMode, setCurrentMode] = React.useState<SyncMode>(
        settings.syncLevel,
    );
    const [currentApiUrl, setCurrentApiUrl] = React.useState<string>(
        settings.apiURL,
    );

    const [backgroundBlur, setBackgroundBlur] = React.useState<number>(
        settings.backgroundBlur,
    );
    const [vibrantColorOpacity, setVibrantColorOpacity] = React.useState<number>(
        settings.vibrantColorOpacity,
    );
    const [textShadowIntensity, setTextShadowIntensity] = React.useState<number>(
        settings.textShadowIntensity,
    );

    const [animationSpeed, setAnimationSpeed] = React.useState<number>(
        settings.animationSpeed,
    );
    const [enableFloatingAnimation, setEnableFloatingAnimation] =
        React.useState<boolean>(settings.enableFloatingAnimation);
    const [enablePulseEffects, setEnablePulseEffects] = React.useState<boolean>(
        settings.enablePulseEffects,
    );

    const [fontSizeScale, setFontSizeScale] = React.useState<number>(
        settings.fontSizeScale,
    );
    const [textOpacity, setTextOpacity] = React.useState<number>(
        settings.textOpacity,
    );

    const [paddingScale, setPaddingScale] = React.useState<number>(
        settings.paddingScale,
    );
    const [borderRadius, setBorderRadius] = React.useState<number>(
        settings.borderRadius,
    );

    const [customVibrantColor, setCustomVibrantColor] = React.useState<string>(
        settings.customVibrantColor,
    );
    const [currentLyricColor, setCurrentLyricColor] = React.useState<string>(
        settings.currentLyricColor,
    );
    const [fullscreenButton, setFullscreenButton] = React.useState<boolean>(
        settings.fullscreenButton,
    );
    const [catJam, setCatJam] = React.useState<CatJam>(settings.catJam);
    const [styleTheme, setStyleTheme] = React.useState<StyleTheme>(settings.styleTheme);
    const [showLyricProgress, setShowLyricProgress] = React.useState<boolean>(
        settings.showLyricProgress,
    );
    const [lyricsOffset, setLyricsOffset] = React.useState<number>(
        settings.lyricsOffset,
    );

    return (
        <LunaSettings>
            <LunaSelectSetting
                title="Sync Mode"
                desc="Select the sync mode for lyrics"
                onChange={(event) => {
                    const mode = event.target.value as SyncMode;
                    settings.syncLevel = mode;
                    setCurrentMode(mode);
                }}
                value={currentMode}
            >
                <LunaSelectItem key="Line" value="Line">
                    Line
                </LunaSelectItem>
                <LunaSelectItem key="Word" value="Word">
                    Word
                </LunaSelectItem>
                <LunaSelectItem key="Character" value="Character">
                    Character
                </LunaSelectItem>
            </LunaSelectSetting>

            <LunaSelectSetting
                title="Cat Jam Mode"
                desc="Select the Cat Jam mode for lyrics"
                onChange={(event) => {
                    const mode = event.target.value as CatJam;
                    settings.catJam = mode;
                    setCatJam(mode);
                }}
                value={catJam}
            >
                <LunaSelectItem key="None" value="None">
                    None
                </LunaSelectItem>
                <LunaSelectItem key="CatJam" value="CatJam">
                    Cat Jam
                </LunaSelectItem>
                <LunaSelectItem key="CatRave" value="CatRave">
                    Cat Rave
                </LunaSelectItem>
                <LunaSelectItem key="CatRave2" value="CatRave2">
                    Cat Rave 2
                </LunaSelectItem>
            </LunaSelectSetting>

            { }
            <div style={{ marginTop: '8px', marginBottom: '16px' }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: 'rgba(255, 255, 255, 0.9)'
                }}>
                    Style Theme
                </div>
                <div style={{
                    fontSize: '12px',
                    marginBottom: '12px',
                    color: 'rgba(255, 255, 255, 0.6)'
                }}>
                    Choose the visual style of the fullscreen player
                </div>
                <ThemePreviewGrid
                    currentTheme={styleTheme}
                    onThemeSelect={(theme) => {
                        settings.styleTheme = theme;
                        setStyleTheme(theme);
                    }}
                />
            </div>

            <LunaTextSetting
                title="API URL"
                desc="The API URL to fetch lyrics from (%s is track id)"
                value={currentApiUrl}
                onChange={(event) => {
                    const url = event.target.value;
                    setCurrentApiUrl(url);
                    if (!URL.canParse(url)) {
                        return;
                    }
                    settings.apiURL = url;
                }}
            />

            <LunaSwitchSetting
                title="Fullscreen Button"
                desc="Adds a fullscreen button at the bottom player"
                checked={fullscreenButton}
                onChange={(event) => {
                    const value = event.target.checked;
                    setFullscreenButton(value);
                    settings.fullscreenButton = value;
                }}
            />

            <LunaSwitchSetting
                title="Show Lyric Progress Bar"
                desc="Display a progress bar below the current lyric (only visible with word-level sync)"
                checked={showLyricProgress}
                onChange={(event) => {
                    const value = event.target.checked;
                    setShowLyricProgress(value);
                    settings.showLyricProgress = value;
                }}
            />

            <LunaTextSetting
                title="Lyrics Offset"
                desc="Offset for lyrics timing in seconds (positive = lyrics appear earlier, negative = lyrics appear later)"
                value={lyricsOffset.toString()}
                onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    if (!isNaN(value)) {
                        setLyricsOffset(value);
                        settings.lyricsOffset = value;
                    }
                }}
            />

            <LunaTextSetting
                title="Background Blur"
                desc="Amount of blur for background image (px)"
                value={backgroundBlur.toString()}
                onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    if (!isNaN(value) && value >= 0) {
                        setBackgroundBlur(value);
                        settings.backgroundBlur = value;
                    }
                }}
            />

            <LunaTextSetting
                title="Vibrant Color Opacity"
                desc="Opacity of vibrant color overlay (0.0-1.0)"
                value={vibrantColorOpacity.toString()}
                onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 1) {
                        setVibrantColorOpacity(value);
                        settings.vibrantColorOpacity = value;
                    }
                }}
            />

            <LunaTextSetting
                title="Text Shadow Intensity"
                desc="Multiplier for text shadow effects (0.0-3.0)"
                value={textShadowIntensity.toString()}
                onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 3) {
                        setTextShadowIntensity(value);
                        settings.textShadowIntensity = value;
                    }
                }}
            />

            <LunaTextSetting
                title="Animation Speed"
                desc="Multiplier for animation speeds (0.1-3.0)"
                value={animationSpeed.toString()}
                onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    if (!isNaN(value) && value >= 0.1 && value <= 3) {
                        setAnimationSpeed(value);
                        settings.animationSpeed = value;
                    }
                }}
            />

            <LunaSwitchSetting
                title="Floating Animation"
                desc="Enable floating animations for album art and background"
                checked={enableFloatingAnimation}
                onChange={(event) => {
                    const value = event.target.checked;
                    setEnableFloatingAnimation(value);
                    settings.enableFloatingAnimation = value;
                }}
            />

            <LunaSwitchSetting
                title="Pulse Effects"
                desc="Enable pulse and glow effects for lyrics"
                checked={enablePulseEffects}
                onChange={(event) => {
                    const value = event.target.checked;
                    setEnablePulseEffects(value);
                    settings.enablePulseEffects = value;
                }}
            />

            <LunaTextSetting
                title="Font Size Scale"
                desc="Multiplier for font sizes (0.5-2.0)"
                value={fontSizeScale.toString()}
                onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    if (!isNaN(value) && value >= 0.5 && value <= 2) {
                        setFontSizeScale(value);
                        settings.fontSizeScale = value;
                    }
                }}
            />

            <LunaTextSetting
                title="Text Opacity"
                desc="Multiplier for text opacity (0.1-1.0)"
                value={textOpacity.toString()}
                onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    if (!isNaN(value) && value >= 0.1 && value <= 1) {
                        setTextOpacity(value);
                        settings.textOpacity = value;
                    }
                }}
            />

            <LunaTextSetting
                title="Padding Scale"
                desc="Multiplier for padding and spacing (0.5-2.0)"
                value={paddingScale.toString()}
                onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    if (!isNaN(value) && value >= 0.5 && value <= 2) {
                        setPaddingScale(value);
                        settings.paddingScale = value;
                    }
                }}
            />

            <LunaTextSetting
                title="Border Radius"
                desc="Border radius for elements (px)"
                value={borderRadius.toString()}
                onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    if (!isNaN(value) && value >= 0) {
                        setBorderRadius(value);
                        settings.borderRadius = value;
                    }
                }}
            />

            <LunaTextSetting
                title="Custom Vibrant Color"
                desc="Override vibrant color (hex code, leave empty for auto)"
                value={customVibrantColor}
                onChange={(event) => {
                    const value = event.target.value;
                    setCustomVibrantColor(value);
                    settings.customVibrantColor = value;
                }}
            />

            <LunaTextSetting
                title="Current Lyric Color"
                desc="Override current lyric color (hex code, leave empty for auto)"
                value={currentLyricColor}
                onChange={(event) => {
                    const value = event.target.value;
                    setCurrentLyricColor(value);
                    settings.currentLyricColor = value;
                }}
            />
            <LunaButtonSetting
                title="Reset to Defaults"
                desc="Reset all settings to their default values"
                onClick={() => {
                    Object.keys(defaultValues).forEach((key) => {
                        // @ts-expect-error: dynamic
                        settings[key] = defaultValues[key];
                    });
                    setCurrentMode(defaultValues.syncLevel);
                    setCurrentApiUrl(defaultValues.apiURL);
                    setStyleTheme(defaultValues.styleTheme);
                    setShowLyricProgress(defaultValues.showLyricProgress);
                    setLyricsOffset(defaultValues.lyricsOffset);
                    setBackgroundBlur(defaultValues.backgroundBlur);
                    setVibrantColorOpacity(defaultValues.vibrantColorOpacity);
                    setTextShadowIntensity(defaultValues.textShadowIntensity);
                    setAnimationSpeed(defaultValues.animationSpeed);
                    setEnableFloatingAnimation(defaultValues.enableFloatingAnimation);
                    setEnablePulseEffects(defaultValues.enablePulseEffects);
                    setFontSizeScale(defaultValues.fontSizeScale);
                    setTextOpacity(defaultValues.textOpacity);
                    setPaddingScale(defaultValues.paddingScale);
                    setBorderRadius(defaultValues.borderRadius);
                    setCustomVibrantColor(defaultValues.customVibrantColor);
                    setCurrentLyricColor(defaultValues.currentLyricColor);
                    setFullscreenButton(defaultValues.fullscreenButton);
                    setCatJam(defaultValues.catJam);
                    trace.msg.log("Settings reset to defaults");
                }}
            />
        </LunaSettings>
    );
};
