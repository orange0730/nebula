interface GradientPreset {
    label: string;
    /** Keyframe CSS injected once; layer.ts applies the matching class. */
    css: string;
}

export const ANIMATED_GRADIENTS: Record<string, GradientPreset> = {
    deepSpace: {
        label: "深邃宇宙 (動態星流)",
        css: `
            background: linear-gradient(-45deg, #0b0c1e, #1b1140, #2c1250, #0b0c1e);
            background-size: 400% 400%;
            animation: vc-live-theme-flow 18s ease infinite;
        `
    },
    auroraForest: {
        label: "極光森林 (緩慢流動)",
        css: `
            background: linear-gradient(-45deg, #013a2f, #0d5c4a, #1f8a6f, #013a2f);
            background-size: 400% 400%;
            animation: vc-live-theme-flow 22s ease infinite;
        `
    },
    cyberNeon: {
        label: "賽博霓虹 (脈動)",
        css: `
            background: linear-gradient(-45deg, #05010f, #1a0033, #2d004d, #05010f);
            background-size: 400% 400%;
            animation: vc-live-theme-flow 12s ease infinite;
        `
    },
    sunsetPulse: {
        label: "溫暖日落 (脈動)",
        css: `
            background: linear-gradient(-45deg, #ff6a3d, #7b2ff7, #ff6a3d, #ffb347);
            background-size: 400% 400%;
            animation: vc-live-theme-flow 16s ease infinite;
        `
    }
};
