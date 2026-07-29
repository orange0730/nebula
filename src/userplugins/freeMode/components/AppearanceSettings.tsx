import { classNameFactory } from "@utils/css";
import { ColorPicker, Forms, Slider } from "@webpack/common";

import { applyAppearance } from "../appearance";
import { settings } from "../settings";

const cl = classNameFactory("nebula-appearance-");

function parseColor(hex: string): number {
    return parseInt(hex.replace("#", ""), 16);
}

function toHex(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
}

export function AppearanceSettingsPanel() {
    const s = settings.use(["accentColor", "overlayDarkness", "cardOpacity", "cardBlur"]);

    return (
        <div className={cl("root")}>
            <div className={cl("row")}>
                <Forms.FormTitle tag="h5">強調色</Forms.FormTitle>
                <ColorPicker
                    color={parseColor(s.accentColor)}
                    onChange={color => { if (color != null) { s.accentColor = toHex(color); applyAppearance(); } }}
                    showEyeDropper={false}
                />
            </div>

            <div className={cl("row")}>
                <Forms.FormTitle tag="h5">背景遮罩深淺</Forms.FormTitle>
                <Slider
                    markers={[0, 0.25, 0.5, 0.75, 1]}
                    minValue={0}
                    maxValue={1}
                    initialValue={s.overlayDarkness}
                    onValueChange={v => { s.overlayDarkness = v; applyAppearance(); }}
                    onValueRender={(v: number) => `${Math.round(v * 100)}%`}
                    stickToMarkers={false}
                />
            </div>

            <div className={cl("row")}>
                <Forms.FormTitle tag="h5">視窗卡片不透明度</Forms.FormTitle>
                <Slider
                    markers={[0.3, 0.5, 0.7, 0.9, 1]}
                    minValue={0.3}
                    maxValue={1}
                    initialValue={s.cardOpacity}
                    onValueChange={v => { s.cardOpacity = v; applyAppearance(); }}
                    onValueRender={(v: number) => `${Math.round(v * 100)}%`}
                    stickToMarkers={false}
                />
            </div>

            <div className={cl("row")}>
                <Forms.FormTitle tag="h5">視窗模糊程度</Forms.FormTitle>
                <Slider
                    markers={[0, 8, 16, 24, 32]}
                    minValue={0}
                    maxValue={32}
                    initialValue={s.cardBlur}
                    onValueChange={v => { s.cardBlur = v; applyAppearance(); }}
                    onValueRender={(v: number) => `${Math.round(v)}px`}
                    stickToMarkers={false}
                />
            </div>
        </div>
    );
}
