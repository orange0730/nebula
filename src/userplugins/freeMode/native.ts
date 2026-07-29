import { BrowserWindow, globalShortcut, IpcMainInvokeEvent, screen } from "electron";
import overlayHtml from "file://overlay.html?minify&base64";

const SHORTCUT = "Control+Shift+`";

let overlayWindow: BrowserWindow | null = null;
let registered = false;

function createOverlayWindow() {
    const { width } = screen.getPrimaryDisplay().workAreaSize;

    const win = new BrowserWindow({
        width: 260,
        height: 320,
        x: width - 300,
        y: 60,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        focusable: false,
        show: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    win.setAlwaysOnTop(true, "screen-saver");
    win.setIgnoreMouseEvents(true);

    win.on("closed", () => {
        overlayWindow = null;
    });

    win.loadURL(`data:text/html;base64,${overlayHtml}`);

    return win;
}

function toggleOverlay() {
    if (!overlayWindow || overlayWindow.isDestroyed()) {
        overlayWindow = createOverlayWindow();
    }

    if (overlayWindow.isVisible()) {
        overlayWindow.hide();
    } else {
        overlayWindow.showInactive();
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
    overlayWindow?.close();
    overlayWindow = null;
}

export function pushState(_event: IpcMainInvokeEvent, state: unknown) {
    if (!overlayWindow || overlayWindow.isDestroyed() || !overlayWindow.isVisible()) return;
    overlayWindow.webContents.executeJavaScript(
        `window.__nebulaSetState && window.__nebulaSetState(${JSON.stringify(state)})`
    ).catch(() => {});
}
