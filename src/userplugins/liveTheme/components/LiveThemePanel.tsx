import { Forms, Select, Slider, TextInput } from "@webpack/common";
import type { CSSProperties } from "react";

import { BackgroundMode, settings } from "..";
import { ANIMATED_GRADIENTS } from "../gradients";

const MODE_OPTIONS = [
    { label: "關閉 (Discord 原始外觀)", value: BackgroundMode.NONE },
    { label: "靜態圖片", value: BackgroundMode.IMAGE },
    { label: "循環播放影片", value: BackgroundMode.VIDEO },
    { label: "動態漸層", value: BackgroundMode.GRADIENT }
];

const GRADIENT_OPTIONS = Object.entries(ANIMATED_GRADIENTS).map(([value, preset]) => ({
    label: preset.label,
    value
}));

export function LiveThemePanel() {
    const s = settings.use(["mode", "mediaUrl", "gradientPreset", "panelOpacity", "panelBlur"]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 8 }}>
            <div>
                <Forms.FormTitle tag="h5">背景模式</Forms.FormTitle>
                <Select
                    options={MODE_OPTIONS}
                    isSelected={v => v === s.mode}
                    select={v => { s.mode = v; }}
                    serialize={String}
                    closeOnSelect
                />
            </div>

            {(s.mode === BackgroundMode.IMAGE || s.mode === BackgroundMode.VIDEO) && (
                <div>
                    <Forms.FormTitle tag="h5">
                        {s.mode === BackgroundMode.IMAGE ? "圖片網址" : "影片網址"}
                    </Forms.FormTitle>
                    <TextInput
                        value={s.mediaUrl}
                        placeholder="https://..."
                        onChange={v => { s.mediaUrl = v; }}
                    />
                </div>
            )}

            {s.mode === BackgroundMode.GRADIENT && (
                <div>
                    <Forms.FormTitle tag="h5">漸層風格</Forms.FormTitle>
                    <Select
                        options={GRADIENT_OPTIONS}
                        isSelected={v => v === s.gradientPreset}
                        select={v => { s.gradientPreset = v; }}
                        serialize={String}
                        closeOnSelect
                    />
                </div>
            )}

            <div>
                <Forms.FormTitle tag="h5">面板不透明度</Forms.FormTitle>
                <Slider
                    markers={[0, 0.25, 0.5, 0.75, 1]}
                    minValue={0}
                    maxValue={1}
                    initialValue={s.panelOpacity}
                    onValueChange={v => { s.panelOpacity = v; }}
                    onValueRender={(v: number) => `${Math.round(v * 100)}%`}
                    stickToMarkers={false}
                />
            </div>

            <div>
                <Forms.FormTitle tag="h5">面板模糊程度</Forms.FormTitle>
                <Slider
                    markers={[0, 4, 8, 12, 16, 24]}
                    minValue={0}
                    maxValue={24}
                    initialValue={s.panelBlur}
                    onValueChange={v => { s.panelBlur = v; }}
                    onValueRender={(v: number) => `${Math.round(v)}px`}
                    stickToMarkers={false}
                />
            </div>

            <div>
                <Forms.FormTitle tag="h5">即時預覽</Forms.FormTitle>
                <PreviewBox mode={s.mode} mediaUrl={s.mediaUrl} gradientPreset={s.gradientPreset} />
            </div>
        </div>
    );
}

function PreviewBox({ mode, mediaUrl, gradientPreset }: { mode: string; mediaUrl: string; gradientPreset: string; }) {
    const boxStyle: CSSProperties = {
        width: "100%",
        height: 120,
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid var(--background-modifier-accent)",
        background: "#202225"
    };

    if (mode === BackgroundMode.IMAGE && mediaUrl) {
        return <div style={{ ...boxStyle, background: `center / cover no-repeat url("${mediaUrl}")` }} />;
    }

    if (mode === BackgroundMode.VIDEO && mediaUrl) {
        return (
            <div style={boxStyle}>
                <video
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            </div>
        );
    }

    if (mode === BackgroundMode.GRADIENT) {
        const preset = ANIMATED_GRADIENTS[gradientPreset] ?? ANIMATED_GRADIENTS[Object.keys(ANIMATED_GRADIENTS)[0]];
        return (
            <div style={boxStyle}>
                <style>{`.vc-live-theme-preview-gradient { ${preset.css} width: 100%; height: 100%; }`}</style>
                <div className="vc-live-theme-preview-gradient" />
            </div>
        );
    }

    return <div style={boxStyle} />;
}
