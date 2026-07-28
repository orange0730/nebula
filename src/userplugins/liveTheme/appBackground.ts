const CLEARED_ATTR = "data-vc-live-theme-cleared";
const MAX_VISITED = 300;
const MAX_DEPTH = 14;

let intervalId: ReturnType<typeof setInterval> | undefined;
let currentTint = "transparent";

function isOpaque(color: string) {
    if (color === "rgba(0, 0, 0, 0)" || color === "transparent") return false;
    const alphaMatch = /rgba?\([^)]*?,\s*([\d.]+)\)/.exec(color);
    if (!alphaMatch) return true;
    return parseFloat(alphaMatch[1]) > 0;
}

function looksLikeBackdrop(el: Element) {
    const cls = (el.className || "").toString().toLowerCase();
    return cls.includes("backdrop") || cls.includes("scrim");
}

/**
 * Discord wraps the whole app (and modals like Settings) in nested
 * full-viewport background divs whose class names are per-build hashes
 * (e.g. "app__160d8", "bg__960e4", "modal_e44912"), so we can't hardcode
 * selectors. Instead we walk down from #app-mount through every
 * full-viewport child, clearing opaque backgrounds as we go so our layer
 * underneath becomes visible. Pure structural wrapper divs (the base app
 * chain) are cleared to fully transparent since they render no content of
 * their own. Once the walk enters a real dialog (role="dialog", e.g. the
 * Settings modal) we switch to tinting instead of full transparency, since
 * those panels have dense text that needs to stay readable. We only skip
 * genuine dimming backdrops (the click-outside-to-close scrim), not the
 * dialog panel itself.
 */
function neutralizeAppBackground() {
    const appMount = document.getElementById("app-mount");
    if (!appMount) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let visited = 0;
    const queue: Array<{ el: Element; depth: number; insideDialog: boolean; }> = [
        { el: appMount, depth: 0, insideDialog: false }
    ];

    while (queue.length && visited < MAX_VISITED) {
        const { el, depth, insideDialog } = queue.shift()!;
        visited++;

        const htmlEl = el as HTMLElement;
        const isDialog = insideDialog || htmlEl.getAttribute("role") === "dialog";

        const cs = getComputedStyle(htmlEl);
        if (isOpaque(cs.backgroundColor) || cs.backgroundImage !== "none") {
            htmlEl.setAttribute(CLEARED_ATTR, "1");
            htmlEl.style.setProperty("background-color", isDialog ? currentTint : "transparent", "important");
            htmlEl.style.setProperty("background-image", "none", "important");
        }

        if (depth >= MAX_DEPTH) continue;

        // Dialog sub-panels (e.g. the content pane next to a settings modal's
        // category sidebar) are legitimately smaller than the full viewport,
        // so once we're inside a dialog we use a much looser size threshold.
        const minWidth = (isDialog ? 0.4 : 0.85) * vw;
        const minHeight = (isDialog ? 0.4 : 0.85) * vh;

        for (const child of el.children) {
            if (looksLikeBackdrop(child)) continue;
            const rect = child.getBoundingClientRect();
            if (rect.width >= minWidth && rect.height >= minHeight) {
                queue.push({ el: child, depth: depth + 1, insideDialog: isDialog });
            }
        }
    }
}

function restoreAppBackground() {
    document.querySelectorAll(`[${CLEARED_ATTR}]`).forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.removeProperty("background-color");
        htmlEl.style.removeProperty("background-image");
        htmlEl.removeAttribute(CLEARED_ATTR);
    });
}

export function startAppBackgroundWatcher(tint: string) {
    currentTint = tint;
    neutralizeAppBackground();
    intervalId ??= setInterval(neutralizeAppBackground, 1500);
}

export function stopAppBackgroundWatcher() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
    }
    restoreAppBackground();
}
