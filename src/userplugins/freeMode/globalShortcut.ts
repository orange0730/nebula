import { toggleFreeMode } from "./state";

function isTyping(el: Element | null) {
    if (!el) return false;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return true;
    return (el as HTMLElement).isContentEditable;
}

function onKeyDown(e: KeyboardEvent) {
    // Ctrl+` (Backquote). Checked by e.code so it works across keyboard layouts.
    if ((e.ctrlKey || e.metaKey) && e.code === "Backquote" && !isTyping(document.activeElement)) {
        e.preventDefault();
        toggleFreeMode();
    }
}

export function startGlobalShortcut() {
    document.addEventListener("keydown", onKeyDown, true);
}

export function stopGlobalShortcut() {
    document.removeEventListener("keydown", onKeyDown, true);
}
