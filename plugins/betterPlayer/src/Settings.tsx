import { ReactiveStore } from "@luna/core";
import {
    LunaButton,
    LunaNumberSetting,
    LunaSelectItem,
    LunaSelectSetting,
    LunaSettings,
    LunaSwitchSetting,
} from "@luna/ui";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Slider,
    Tab,
    Tabs,
    Typography,
    styled
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { sendCommand } from "./index";

const ExpandMoreIcon = () => <span style={{ fontSize: 20, opacity: 0.7 }}>▼</span>;

interface EQBand { freq: number; gain: number; q: number; }
interface CompressorSettings { thresholdDb: number; ratio: number; attackMs: number; releaseMs: number; kneeDb: number; makeupGainDb: number; }
interface ReverbSettings { roomSize: number; damping: number; wetLevel: number; dryLevel: number; }
interface StereoSettings { width: number; pan: number; balance: number; midGainDb: number; sideGainDb: number; mono: boolean; }
interface DelaySettings { delayMs: number; feedback: number; wetLevel: number; }
interface LimiterSettings { thresholdDb: number; releaseMs: number; }
interface FilterSettings { type: "lowpass" | "highpass" | "bandpass" | "notch"; cutoff: number; q: number; }
interface GainSettings { gainDb: number; muted: boolean; }

const DEFAULT_EQ_BANDS: EQBand[] = [
    { freq: 32, gain: 0, q: 1.0 }, { freq: 64, gain: 0, q: 1.0 }, { freq: 125, gain: 0, q: 1.0 },
    { freq: 250, gain: 0, q: 1.0 }, { freq: 500, gain: 0, q: 1.0 }, { freq: 1000, gain: 0, q: 1.0 },
    { freq: 2000, gain: 0, q: 1.0 }, { freq: 4000, gain: 0, q: 1.0 }, { freq: 8000, gain: 0, q: 1.0 },
    { freq: 16000, gain: 0, q: 1.0 },
];

const EQ_PRESETS: Record<string, EQBand[]> = {
    flat: DEFAULT_EQ_BANDS.map(b => ({ ...b, gain: 0 })),
    bass_boost: DEFAULT_EQ_BANDS.map(b => b.freq < 250 ? { ...b, gain: 4 } : { ...b, gain: 0 }),
    treble_boost: DEFAULT_EQ_BANDS.map(b => b.freq > 2000 ? { ...b, gain: 4 } : { ...b, gain: 0 }),
    vocal: DEFAULT_EQ_BANDS.map(b => (b.freq >= 500 && b.freq <= 4000) ? { ...b, gain: 3 } : { ...b, gain: -1 }),
    loudness: DEFAULT_EQ_BANDS.map(b => (b.freq < 250 || b.freq > 4000) ? { ...b, gain: 4 } : { ...b, gain: -2 }),
};

export const settings = await ReactiveStore.getPluginStorage("betterPlayer", {
    eqEnabled: false,
    eqBands: [...DEFAULT_EQ_BANDS],
    eqPreset: "flat",
    compressorEnabled: false,
    compressor: { thresholdDb: -20, ratio: 4, attackMs: 10, releaseMs: 100, kneeDb: 6, makeupGainDb: 0 },
    limiterEnabled: false,
    limiter: { thresholdDb: -1, releaseMs: 50 },
    reverbEnabled: false,
    reverb: { roomSize: 0.5, damping: 0.5, wetLevel: 0.3, dryLevel: 0.7 },
    stereo: { width: 1.0, pan: 0, balance: 0, midGainDb: 0, sideGainDb: 0, mono: false },
    delayEnabled: false,
    delay: { delayMs: 250, feedback: 0.3, wetLevel: 0.25 },
    filterEnabled: false,
    filter: { type: "lowpass", cutoff: 8000, q: 0.707 },
    gain: { gainDb: 0, muted: false },
    effectChainEnabled: true,
    visualizerEnabled: false,
    loudnessEnabled: false,
    dcBlockerEnabled: false,
});


const TransparentAccordion = styled(Accordion)(() => ({
    background: "transparent",
    boxShadow: "none",
    "&:before": { display: "none" },
    "&.Mui-expanded": { margin: 0 },
}));

const NoBgContainer = styled(Box)(() => ({
    background: "transparent",
    width: "100%",
}));

const FreqLabel = (freq: number) => freq >= 1000 ? `${freq / 1000}k` : `${freq}`;


const EqualizerPanel = () => {
    const [enabled, setEnabled] = useState(settings.eqEnabled);
    const [bands, setBands] = useState<EQBand[]>([...settings.eqBands]);
    const [preset, setPreset] = useState(settings.eqPreset);

    const updateEQ = (newBands: EQBand[]) => {
        setBands(newBands);
        settings.eqBands = newBands;
        if (enabled || settings.eqEnabled) sendCommand("audio.eq.set", { bands: newBands });
    };

    const handleBand = (idx: number, gain: number) => {
        const next = [...bands];
        next[idx] = { ...next[idx], gain };
        updateEQ(next);
        setPreset("custom");
    };

    const toggle = (val: boolean) => {
        setEnabled(val);
        settings.eqEnabled = val;
        sendCommand(val ? "audio.effect.enable" : "audio.effect.disable", { effect: "eq" });
        if (val) sendCommand("audio.eq.set", { bands });
    };

    return (
        <NoBgContainer>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Equalizer</Typography>
                <Box display="flex" gap={2} alignItems="center">
                    <LunaButton size="small" onClick={() => { updateEQ(DEFAULT_EQ_BANDS); setPreset("flat"); }}>Reset</LunaButton>
                    <LunaSwitchSetting title="" value={enabled} onChange={(_, v) => toggle(v)} />
                </Box>
            </Box>

            <LunaSelectSetting title="Preset" value={preset} onChange={(e) => {
                const p = e.target.value;
                setPreset(p);
                settings.eqPreset = p;
                if (EQ_PRESETS[p]) updateEQ(EQ_PRESETS[p]);
            }}>
                {Object.keys(EQ_PRESETS).map(k => <LunaSelectItem key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</LunaSelectItem>)}
                <LunaSelectItem value="custom">Custom</LunaSelectItem>
            </LunaSelectSetting>

            <Box display="flex" justifyContent="space-between" mt={4} px={1} gap={1}>
                {bands.map((b, i) => (
                    <Box key={i} display="flex" flexDirection="column" alignItems="center" flex={1}>
                        <Typography variant="caption" color="text.secondary" mb={1}>{FreqLabel(b.freq)}</Typography>
                        <Slider
                            orientation="vertical"
                            value={b.gain}
                            min={-12} max={12} step={0.5}
                            disabled={!enabled}
                            onChange={(_, v) => handleBand(i, v as number)}
                            sx={{ height: 140 }}
                            valueLabelDisplay="auto"
                        />
                        <Typography variant="caption" mt={1}>{b.gain > 0 ? "+" : ""}{b.gain}</Typography>
                    </Box>
                ))}
            </Box>
        </NoBgContainer>
    );
};

const DynamicsPanel = () => {

    const [compEnabled, setCompEnabled] = useState(settings.compressorEnabled);
    const [comp, setComp] = useState(settings.compressor);


    const [limEnabled, setLimEnabled] = useState(settings.limiterEnabled);
    const [lim, setLim] = useState(settings.limiter);


    const [gain, setGain] = useState(settings.gain);

    const updateComp = <K extends keyof CompressorSettings>(k: K, v: number) => {
        const next = { ...comp, [k]: v };
        setComp(next);
        settings.compressor = next;
        if (compEnabled) sendCommand("audio.compressor.config", next);
    };

    const updateLim = <K extends keyof LimiterSettings>(k: K, v: number) => {
        const next = { ...lim, [k]: v };
        setLim(next);
        settings.limiter = next;
        if (limEnabled) sendCommand("audio.limiter.set", next);
    };

    return (
        <NoBgContainer>
            { }
            <TransparentAccordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={600}>Master Output</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <LunaSwitchSetting
                        title="Mute"
                        value={gain.muted}
                        onChange={(_, v) => {
                            setGain(p => ({ ...p, muted: v }));
                            settings.gain.muted = v;
                            sendCommand("audio.mute", { muted: v });
                        }}
                    />
                    <LunaNumberSetting
                        title="Gain (dB)"
                        value={gain.gainDb} min={-24} max={24}
                        onChange={(e) => {
                            const v = parseFloat(e.target.value) || 0;
                            setGain(p => ({ ...p, gainDb: v }));
                            settings.gain.gainDb = v;
                            sendCommand("audio.gain.set", { gainDb: v });
                        }}
                    />
                </AccordionDetails>
            </TransparentAccordion>

            { }
            <TransparentAccordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" width="100%" gap={2}>
                        <Typography>Compressor</Typography>
                        <LunaSwitchSetting title="" value={compEnabled} onChange={(e, v) => {
                            e.stopPropagation();
                            setCompEnabled(v);
                            settings.compressorEnabled = v;
                            sendCommand(v ? "audio.effect.enable" : "audio.effect.disable", { effect: "compressor" });
                            if (v) sendCommand("audio.compressor.config", comp);
                        }} />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box display="flex" flexDirection="column" gap={1}>
                        <LunaNumberSetting title="Threshold (dB)" value={comp.thresholdDb} min={-60} max={0} disabled={!compEnabled} onChange={e => updateComp("thresholdDb", +e.target.value)} />
                        <LunaNumberSetting title="Ratio" value={comp.ratio} min={1} max={20} disabled={!compEnabled} onChange={e => updateComp("ratio", +e.target.value)} />
                        <LunaNumberSetting title="Attack (ms)" value={comp.attackMs} min={0.1} max={100} disabled={!compEnabled} onChange={e => updateComp("attackMs", +e.target.value)} />
                        <LunaNumberSetting title="Release (ms)" value={comp.releaseMs} min={10} max={1000} disabled={!compEnabled} onChange={e => updateComp("releaseMs", +e.target.value)} />
                        <LunaNumberSetting title="Knee (dB)" value={comp.kneeDb} min={0} max={20} disabled={!compEnabled} onChange={e => updateComp("kneeDb", +e.target.value)} />
                        <LunaNumberSetting title="Makeup (dB)" value={comp.makeupGainDb} min={0} max={24} disabled={!compEnabled} onChange={e => updateComp("makeupGainDb", +e.target.value)} />
                    </Box>
                </AccordionDetails>
            </TransparentAccordion>

            { }
            <TransparentAccordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" width="100%" gap={2}>
                        <Typography>Limiter</Typography>
                        <LunaSwitchSetting title="" value={limEnabled} onChange={(e, v) => {
                            e.stopPropagation();
                            setLimEnabled(v);
                            settings.limiterEnabled = v;
                            sendCommand(v ? "audio.effect.enable" : "audio.effect.disable", { effect: "limiter" });
                            if (v) sendCommand("audio.limiter.set", lim);
                        }} />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <LunaNumberSetting title="Threshold (dB)" value={lim.thresholdDb} min={-20} max={0} disabled={!limEnabled} onChange={e => updateLim("thresholdDb", +e.target.value)} />
                    <LunaNumberSetting title="Release (ms)" value={lim.releaseMs} min={1} max={500} disabled={!limEnabled} onChange={e => updateLim("releaseMs", +e.target.value)} />
                </AccordionDetails>
            </TransparentAccordion>
        </NoBgContainer>
    );
};

const AmbiencePanel = () => {
    const [revEnabled, setRevEnabled] = useState(settings.reverbEnabled);
    const [rev, setRev] = useState(settings.reverb);
    const [delEnabled, setDelEnabled] = useState(settings.delayEnabled);
    const [del, setDel] = useState(settings.delay);
    const [filEnabled, setFilEnabled] = useState(settings.filterEnabled);
    const [fil, setFil] = useState(settings.filter);

    const updateRev = <K extends keyof ReverbSettings>(k: K, v: number) => {
        const next = { ...rev, [k]: v };
        setRev(next);
        settings.reverb = next;
        if (revEnabled) {
            sendCommand("audio.reverb.set", { roomSize: next.roomSize, damping: next.damping, wetLevel: next.wetLevel });
            sendCommand("audio.reverb.wetdry", { wet: next.wetLevel, dry: next.dryLevel });
        }
    };

    const updateDel = <K extends keyof DelaySettings>(k: K, v: number) => {
        const next = { ...del, [k]: v };
        setDel(next);
        settings.delay = next;
        if (delEnabled) sendCommand("audio.delay.set", next);
    };

    const updateFil = <K extends keyof FilterSettings>(k: K, v: any) => {
        const next = { ...fil, [k]: v };
        setFil(next);
        settings.filter = next;
        if (filEnabled) sendCommand("audio.filter.set", next);
    };

    return (
        <NoBgContainer>
            { }
            <TransparentAccordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" width="100%" gap={2}>
                        <Typography>Reverb</Typography>
                        <LunaSwitchSetting title="" value={revEnabled} onChange={(e, v) => {
                            e.stopPropagation(); setRevEnabled(v); settings.reverbEnabled = v;
                            sendCommand(v ? "audio.effect.enable" : "audio.effect.disable", { effect: "reverb" });
                            if (v) updateRev("roomSize", rev.roomSize);
                        }} />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <LunaNumberSetting title="Room Size" value={rev.roomSize * 100} min={0} max={100} disabled={!revEnabled} onChange={e => updateRev("roomSize", (+e.target.value) / 100)} />
                    <LunaNumberSetting title="Damping" value={rev.damping * 100} min={0} max={100} disabled={!revEnabled} onChange={e => updateRev("damping", (+e.target.value) / 100)} />
                    <LunaNumberSetting title="Wet" value={rev.wetLevel * 100} min={0} max={100} disabled={!revEnabled} onChange={e => updateRev("wetLevel", (+e.target.value) / 100)} />
                    <LunaNumberSetting title="Dry" value={rev.dryLevel * 100} min={0} max={100} disabled={!revEnabled} onChange={e => updateRev("dryLevel", (+e.target.value) / 100)} />
                </AccordionDetails>
            </TransparentAccordion>

            { }
            <TransparentAccordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" width="100%" gap={2}>
                        <Typography>Delay</Typography>
                        <LunaSwitchSetting title="" value={delEnabled} onChange={(e, v) => {
                            e.stopPropagation(); setDelEnabled(v); settings.delayEnabled = v;
                            sendCommand(v ? "audio.effect.enable" : "audio.effect.disable", { effect: "delay" });
                            if (v) sendCommand("audio.delay.set", del);
                        }} />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <LunaNumberSetting title="Time (ms)" value={del.delayMs} min={1} max={2000} disabled={!delEnabled} onChange={e => updateDel("delayMs", +e.target.value)} />
                    <LunaNumberSetting title="Feedback" value={del.feedback * 100} min={0} max={95} disabled={!delEnabled} onChange={e => updateDel("feedback", (+e.target.value) / 100)} />
                    <LunaNumberSetting title="Wet" value={del.wetLevel * 100} min={0} max={100} disabled={!delEnabled} onChange={e => updateDel("wetLevel", (+e.target.value) / 100)} />
                </AccordionDetails>
            </TransparentAccordion>

            { }
            <TransparentAccordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" width="100%" gap={2}>
                        <Typography>Filter</Typography>
                        <LunaSwitchSetting title="" value={filEnabled} onChange={(e, v) => {
                            e.stopPropagation(); setFilEnabled(v); settings.filterEnabled = v;
                            sendCommand(v ? "audio.effect.enable" : "audio.effect.disable", { effect: "filter" });
                            if (v) sendCommand("audio.filter.set", fil);
                        }} />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <LunaSelectSetting title="Type" value={fil.type} onChange={e => updateFil("type", e.target.value)}>
                        <LunaSelectItem value="lowpass">Low Pass</LunaSelectItem>
                        <LunaSelectItem value="highpass">High Pass</LunaSelectItem>
                        <LunaSelectItem value="bandpass">Band Pass</LunaSelectItem>
                        <LunaSelectItem value="notch">Notch</LunaSelectItem>
                    </LunaSelectSetting>
                    <LunaNumberSetting title="Cutoff (Hz)" value={fil.cutoff} min={20} max={20000} disabled={!filEnabled} onChange={e => updateFil("cutoff", +e.target.value)} />
                    <LunaNumberSetting title="Q Factor" value={fil.q} min={0.1} max={10} disabled={!filEnabled} onChange={e => updateFil("q", +e.target.value)} />
                </AccordionDetails>
            </TransparentAccordion>
        </NoBgContainer>
    );
};

const StereoPanel = () => {
    const [st, setSt] = useState(settings.stereo);

    const update = <K extends keyof StereoSettings>(k: K, v: any) => {
        const next = { ...st, [k]: v };
        setSt(next);
        settings.stereo = next;

        if (k === "width") sendCommand("audio.stereo.width", { width: v });
        if (k === "pan") sendCommand("audio.pan.set", { position: v });
        if (k === "balance") sendCommand("audio.balance.set", { position: v });
        if (k === "mono") sendCommand("audio.stereo.mono", { enabled: v });
        if (k === "midGainDb" || k === "sideGainDb") {
            sendCommand("audio.stereo.midside", { midGainDb: next.midGainDb, sideGainDb: next.sideGainDb });
        }
    };

    return (
        <NoBgContainer>
            <LunaSwitchSetting title="Mono Mix" value={st.mono} onChange={(_, v) => update("mono", v)} />
            <Box mt={2} display="flex" flexDirection="column" gap={1}>
                <LunaNumberSetting title="Stereo Width (%)" value={st.width * 100} min={0} max={200} onChange={e => update("width", (+e.target.value) / 100)} />
                <LunaNumberSetting title="Pan" value={st.pan * 100} min={-100} max={100} onChange={e => update("pan", (+e.target.value) / 100)} />
                <LunaNumberSetting title="Balance" value={st.balance * 100} min={-100} max={100} onChange={e => update("balance", (+e.target.value) / 100)} />
                <LunaNumberSetting title="Mid Gain (dB)" value={st.midGainDb} min={-12} max={12} onChange={e => update("midGainDb", +e.target.value)} />
                <LunaNumberSetting title="Side Gain (dB)" value={st.sideGainDb} min={-12} max={12} onChange={e => update("sideGainDb", +e.target.value)} />
            </Box>
        </NoBgContainer>
    );
};

const GlobalPanel = () => {
    const [global, setGlobal] = useState({
        chain: settings.effectChainEnabled,
        vis: settings.visualizerEnabled,
        loud: settings.loudnessEnabled,
        dc: settings.dcBlockerEnabled
    });

    const toggle = (k: keyof typeof global, v: boolean) => {
        setGlobal(p => ({ ...p, [k]: v }));
        if (k === 'chain') { settings.effectChainEnabled = v; sendCommand("audio.effect.chain.enable", { enabled: v }); }
        if (k === 'vis') { settings.visualizerEnabled = v; v ? sendCommand("audio.visualizer.enable", { sampleRate: 60 }) : sendCommand("audio.visualizer.disable"); }
        if (k === 'loud') { settings.loudnessEnabled = v; v ? sendCommand("audio.loudness.enable") : sendCommand("audio.loudness.disable"); }
        if (k === 'dc') { settings.dcBlockerEnabled = v; sendCommand("audio.filter.dcblocker", { enabled: v }); }
    };

    return (
        <NoBgContainer>
            <Typography variant="h6" mb={2}>Global Processing</Typography>
            <Box display="flex" flexDirection="column" gap={1}>
                <LunaSwitchSetting title="Effects Chain" desc="Master bypass for all effects" value={global.chain} onChange={(_, v) => toggle('chain', v)} />
                <LunaSwitchSetting title="Visualizer" value={global.vis} onChange={(_, v) => toggle('vis', v)} />
                <LunaSwitchSetting title="Loudness Meter" value={global.loud} onChange={(_, v) => toggle('loud', v)} />
                <LunaSwitchSetting title="DC Blocker" value={global.dc} onChange={(_, v) => toggle('dc', v)} />

                <Box display="flex" gap={2} mt={3}>
                    <LunaButton onClick={() => sendCommand("audio.effect.clear")}>Clear Effects</LunaButton>
                    <LunaButton onClick={() => sendCommand("audio.pipeline.reset")}>Reset Pipeline</LunaButton>
                </Box>
            </Box>
        </NoBgContainer>
    );
};


export function Settings() {
    const [tab, setTab] = useState(0);


    useEffect(() => {

        const s = settings;
        if (s.eqEnabled) { sendCommand("audio.eq.set", { bands: s.eqBands }); sendCommand("audio.effect.enable", { effect: "eq" }); }
        if (s.compressorEnabled) { sendCommand("audio.compressor.config", s.compressor); sendCommand("audio.effect.enable", { effect: "compressor" }); }
        if (s.limiterEnabled) { sendCommand("audio.limiter.set", s.limiter); sendCommand("audio.effect.enable", { effect: "limiter" }); }
        if (s.reverbEnabled) { sendCommand("audio.reverb.set", s.reverb); sendCommand("audio.effect.enable", { effect: "reverb" }); }
        if (s.delayEnabled) { sendCommand("audio.delay.set", s.delay); sendCommand("audio.effect.enable", { effect: "delay" }); }
        if (s.filterEnabled) { sendCommand("audio.filter.set", s.filter); sendCommand("audio.effect.enable", { effect: "filter" }); }

        sendCommand("audio.stereo.width", { width: s.stereo.width });
        sendCommand("audio.pan.set", { position: s.stereo.pan });
        sendCommand("audio.balance.set", { position: s.stereo.balance });
        sendCommand("audio.stereo.midside", { midGainDb: s.stereo.midGainDb, sideGainDb: s.stereo.sideGainDb });
        sendCommand("audio.stereo.mono", { enabled: s.stereo.mono });
        sendCommand("audio.gain.set", { gainDb: s.gain.gainDb });
        sendCommand("audio.mute", { muted: s.gain.muted });
        sendCommand("audio.effect.chain.enable", { enabled: s.effectChainEnabled });
        sendCommand("audio.filter.dcblocker", { enabled: s.dcBlockerEnabled });
    }, []);

    const TabContent = ({ index, children }: { index: number, children: React.ReactNode }) => (
        <div hidden={tab !== index} style={{ width: '100%', paddingTop: 20 }}>{tab === index && children}</div>
    );

    return (
        <LunaSettings>
            <NoBgContainer>
                <Typography variant="h5" fontWeight={700} mb={2}>Better Player</Typography>

                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tab label="EQ" />
                    <Tab label="Dynamics" />
                    <Tab label="Ambience" />
                    <Tab label="Stereo" />
                    <Tab label="Global" />
                </Tabs>

                <TabContent index={0}><EqualizerPanel /></TabContent>
                <TabContent index={1}><DynamicsPanel /></TabContent>
                <TabContent index={2}><AmbiencePanel /></TabContent>
                <TabContent index={3}><StereoPanel /></TabContent>
                <TabContent index={4}><GlobalPanel /></TabContent>
            </NoBgContainer>
        </LunaSettings>
    );
}