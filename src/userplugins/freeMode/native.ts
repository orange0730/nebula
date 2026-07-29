import { BrowserWindow, globalShortcut, IpcMainInvokeEvent, screen } from "electron";
import overlayHtml from "file://overlay.html?minify&base64";

import { tryRegisterPortalShortcut, unregisterPortalShortcut } from "./globalShortcutPortal";

const SHORTCUT = "Control+Shift+`";
const SEND_PREFIX = "NEBULA_SEND:";

type OverlayKind = "channel" | "voiceRoom";

interface OverlayItemMeta {
    id: string;
    kind: OverlayKind;
    x: number;
    y: number;
    width: number;
    height: number;
}

type ShortcutMode = "portal" | "electron" | null;

const windows = new Map<string, BrowserWindow>();
let electronRegistered = false;
let shortcutMode: ShortcutMode = null;
let visible = false;

function getMainWindow(): BrowserWindow | undefined {
    const overlaySet = new Set(windows.values());
    return BrowserWindow.getAllWindows().find(w => !overlaySet.has(w));
}

function positionWindow(win: BrowserWindow, item: OverlayItemMeta) {
    const mainBounds = getMainWindow()?.getBounds() ?? { x: 0, y: 0 };
    const work = screen.getPrimaryDisplay().workArea;

    const width = Math.min(Math.max(160, Math.round(item.width)), work.width);
    const height = Math.min(Math.max(120, Math.round(item.height)), work.height);

    const x = Math.min(
        Math.max(Math.round(mainBounds.x + item.x), work.x),
        work.x + work.width - width
    );
    const y = Math.min(
        Math.max(Math.round(mainBounds.y + item.y), work.y),
        work.y + work.height - height
    );

    win.setBounds({ x, y, width, height });
}

function handleSend(itemId: string, text: string) {
    const mainWin = getMainWindow();
    if (!mainWin) return;
    mainWin.webContents.executeJavaScript(
        `window.__nebulaSendMessage && window.__nebulaSendMessage(${JSON.stringify(itemId)}, ${JSON.stringify(text)})`
    ).catch(() => {});
}

function createOverlayWindow(itemId: string) {
    const win = new BrowserWindow({
        width: 280,
        height: 320,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        show: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    win.setAlwaysOnTop(true, "screen-saver");
    win.loadURL(`data:text/html;base64,${overlayHtml}`);

    win.webContents.once("did-finish-load", () => {
        win.webContents.executeJavaScript(`window.__nebulaItemId = ${JSON.stringify(itemId)}`).catch(() => {});
    });

    win.webContents.on("console-message", (_event, _level, message) => {
        if (!message.startsWith(SEND_PREFIX)) return;
        try {
            const { itemId: fromItemId, text } = JSON.parse(message.slice(SEND_PREFIX.length));
            handleSend(fromItemId, text);
        } catch {
            // ignore malformed bridge messages
        }
    });

    return win;
}

export function syncOverlayItems(_event: IpcMainInvokeEvent, items: OverlayItemMeta[]) {
    const nextIds = new Set(items.map(i => i.id));

    for (const [id, win] of windows) {
        if (!nextIds.has(id)) {
            win.close();
            windows.delete(id);
        }
    }

    for (const item of items) {
        let win = windows.get(item.id);
        if (!win || win.isDestroyed()) {
            win = createOverlayWindow(item.id);
            windows.set(item.id, win);
            win.on("closed", () => windows.delete(item.id));
            if (visible) win.show();
        }
        positionWindow(win, item);
    }
}

function toggleOverlay() {
    visible = !visible;
    for (const win of windows.values()) {
        if (visible) win.show();
        else win.hide();
    }
}

export async function registerShortcut(_event: IpcMainInvokeEvent) {
    if (shortcutMode) return { mode: shortcutMode };

    const portalResult = await tryRegisterPortalShortcut(toggleOverlay);
    if (portalResult.ok) {
        shortcutMode = "portal";
        return { mode: "portal" as const };
    }

    electronRegistered = globalShortcut.register(SHORTCUT, toggleOverlay);
    shortcutMode = "electron";
    return { mode: "electron" as const, portalFailureReason: portalResult.reason };
}

export async function unregisterShortcut(_event: IpcMainInvokeEvent) {
    if (shortcutMode === "portal") {
        await unregisterPortalShortcut();
    } else if (shortcutMode === "electron" && electronRegistered) {
        globalShortcut.unregister(SHORTCUT);
        electronRegistered = false;
    }

    shortcutMode = null;
    visible = false;
    for (const win of windows.values()) win.close();
    windows.clear();
}

export function pushState(_event: IpcMainInvokeEvent, itemId: string, state: unknown) {
    const win = windows.get(itemId);
    if (!win || win.isDestroyed() || !win.isVisible()) return;
    win.webContents.executeJavaScript(
        `window.__nebulaSetState && window.__nebulaSetState(${JSON.stringify(state)})`
    ).catch(() => {});
}
