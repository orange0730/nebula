import { managedStyleRootNode } from "@api/Styles";
import { createAndAppendStyle } from "@utils/css";

import { BackgroundMode } from ".";
import { ANIMATED_GRADIENTS } from "./gradients";

const LAYER_ID = "vc-live-theme-layer";

let keyframesStyle: HTMLStyleElement | undefined;

interface RenderOptions {
    mode: BackgroundMode;
    mediaUrl: string;
    gradientCss: string;
}

function ensureKeyframes() {
    if (keyframesStyle) return;

    keyframesStyle = createAndAppendStyle("VcLiveThemeKeyframes", managedStyleRootNode);
    keyframesStyle.textContent = `
        @keyframes vc-live-theme-flow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
    `;
}

function getOrCreateLayer(): HTMLDivElement {
    let layer = document.getElementById(LAYER_ID) as HTMLDivElement | null;
    if (layer) return layer;

    layer = document.createElement("div");
    layer.id = LAYER_ID;
    Object.assign(layer.style, {
        position: "fixed",
        inset: "0",
        zIndex: "0",
        pointerEvents: "none",
        overflow: "hidden"
    } satisfies Partial<CSSStyleDeclaration>);

    document.body.prepend(layer);
    return layer;
}

export function renderLayer({ mode, mediaUrl, gradientCss }: RenderOptions) {
    if (mode === BackgroundMode.NONE) {
        teardownLayer();
        return;
    }

    ensureKeyframes();
    const layer = getOrCreateLayer();
    layer.innerHTML = "";
    layer.removeAttribute("style-mode");

    switch (mode) {
        case BackgroundMode.IMAGE: {
            layer.style.background = mediaUrl
                ? `center / cover no-repeat url("${mediaUrl}")`
                : "";
            layer.style.animation = "";
            break;
        }
        case BackgroundMode.VIDEO: {
            layer.style.background = "";
            layer.style.animation = "";
            if (mediaUrl) {
                const video = document.createElement("video");
                Object.assign(video, {
                    src: mediaUrl,
                    autoplay: true,
                    loop: true,
                    muted: true,
                    playsInline: true
                });
                Object.assign(video.style, {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                } satisfies Partial<CSSStyleDeclaration>);
                layer.appendChild(video);
            }
            break;
        }
        case BackgroundMode.GRADIENT: {
            layer.setAttribute("style", `position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;${gradientCss || ANIMATED_GRADIENTS.deepSpace.css}`);
            break;
        }
    }
}

export function teardownLayer() {
    document.getElementById(LAYER_ID)?.remove();
    keyframesStyle?.remove();
    keyframesStyle = undefined;
}
