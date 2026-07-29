import { BrowserWindow, globalShortcut, IpcMainInvokeEvent } from "electron";
import overlayHtml from "file://overlay.html?minify&base64";

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

const windows = new Map<string, BrowserWindow>();
let registered = false;
let visible = false;

function getMainWindow(): BrowserWindow | undefined {
    const overlaySet = new Set(windows.values());
    return BrowserWindow.getAllWindows().find(w => !overlaySet.has(w));
}

function positionWindow(win: BrowserWindow, item: OverlayItemMeta) {
    const mainBounds = getMainWindow()?.getBounds() ?? { x: 0, y: 0 };
    win.setBounds({
        x: Math.round(mainBounds.x + item.x),
        y: Math.round(mainBounds.y + item.y),
        width: Math.max(160, Math.round(item.width)),
        height: Math.max(120, Math.round(item.height))
    });
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

export function registerShortcut(_event: IpcMainInvokeEvent) {
    if (registered) return;
    registered = globalShortcut.register(SHORTCUT, toggleOverlay);
}

export function unregisterShortcut(_event: IpcMainInvokeEvent) {
    if (!registered) return;
    globalShortcut.unregister(SHORTCUT);
    registered = false;
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
