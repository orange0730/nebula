import { managedStyleRootNode } from "@api/Styles";
import { createAndAppendStyle } from "@utils/css";

import { settings } from "./settings";

let styleEl: HTMLStyleElement | undefined;

function hexToRgb(hex: string): string {
    const clean = hex.replace("#", "");
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}

export function applyAppearance() {
    styleEl ??= createAndAppendStyle("VcNebulaFreeModeAppearance", managedStyleRootNode);

    const { accentColor, overlayDarkness, cardOpacity, cardBlur } = settings.store;
    const rgb = hexToRgb(accentColor);

    styleEl.textContent = `
        :root {
            --nebula-accent: ${accentColor};
            --nebula-accent-soft: rgba(${rgb}, 0.35);
            --nebula-bg: rgba(8, 6, 16, ${overlayDarkness});
            --nebula-card-bg: rgba(18, 15, 28, ${cardOpacity});
            --nebula-blur-window: ${cardBlur}px;
        }
    `;
}

export function teardownAppearance() {
    styleEl?.remove();
    styleEl = undefined;
}
