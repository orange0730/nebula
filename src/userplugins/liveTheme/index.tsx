import { definePluginSettings } from "@api/Settings";
import { managedStyleRootNode } from "@api/Styles";
import { createAndAppendStyle } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";

import { startAppBackgroundWatcher, stopAppBackgroundWatcher } from "./appBackground";
import { LiveThemePanel } from "./components/LiveThemePanel";
import { ANIMATED_GRADIENTS } from "./gradients";
import { renderLayer, teardownLayer } from "./layer";
import { PANEL_BACKGROUND_TOKENS } from "./panelTokens";

export const enum BackgroundMode {
    NONE = "none",
    IMAGE = "image",
    VIDEO = "video",
    GRADIENT = "gradient"
}

let panelStyle: HTMLStyleElement;

export const settings = definePluginSettings({
    mode: {
        type: OptionType.CUSTOM,
        default: BackgroundMode.NONE,
        onChange: applyBackground
    },
    mediaUrl: {
        type: OptionType.CUSTOM,
        default: "",
        onChange: applyBackground
    },
    gradientPreset: {
        type: OptionType.CUSTOM,
        default: Object.keys(ANIMATED_GRADIENTS)[0],
        onChange: applyBackground
    },
    panelOpacity: {
        type: OptionType.CUSTOM,
        default: 0.75,
        onChange: applyBackground
    },
    panelBlur: {
        type: OptionType.CUSTOM,
        default: 6,
        onChange: applyBackground
    },
    panel: {
        type: OptionType.COMPONENT,
        description: "LiveTheme 設定",
        component: LiveThemePanel
    }
});

export function applyBackground() {
    const { mode, mediaUrl, gradientPreset, panelOpacity, panelBlur } = settings.store;

    renderLayer({
        mode: mode as BackgroundMode,
        mediaUrl,
        gradientCss: ANIMATED_GRADIENTS[gradientPreset]?.css ?? ANIMATED_GRADIENTS[Object.keys(ANIMATED_GRADIENTS)[0]].css
    });

    if (mode === BackgroundMode.NONE) {
        panelStyle.textContent = "";
        stopAppBackgroundWatcher();
        return;
    }

    const tint = `rgba(0, 0, 0, ${1 - panelOpacity})`;
    startAppBackgroundWatcher(tint);

    const tokenOverrides = PANEL_BACKGROUND_TOKENS
        .map(token => `${token}: ${tint} !important;`)
        .join("\n            ");

    panelStyle.textContent = `
        :root {
            ${tokenOverrides}
        }
        #app-mount nav {
            background-color: ${tint} !important;
            background-image: none !important;
        }
        #app-mount {
            backdrop-filter: blur(${panelBlur}px) !important;
        }
    `;
}

export default definePlugin({
    name: "LiveTheme",
    description: "動態/即時背景系統：支援圖片、影片、動態漸層，並提供面板透明度與模糊控制。",
    authors: [{ name: "orange980730", id: 0n }],
    tags: ["Appearance", "Customisation"],
    settings,

    start() {
        panelStyle = createAndAppendStyle("VcLiveThemePanels", managedStyleRootNode);
        applyBackground();
    },

    stop() {
        panelStyle?.remove();
        teardownLayer();
        stopAppBackgroundWatcher();
    }
});
