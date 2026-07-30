import { BrowserWindow, globalShortcut, IpcMainInvokeEvent, screen } from "electron";
import launcherHtml from "file://launcher.html?minify&base64";
import overlayHtml from "file://overlay.html?minify&base64";

import { tryRegisterPortalShortcut, unregisterPortalShortcut } from "./globalShortcutPortal";

const SHORTCUT = "Control+Shift+`";
const SEND_PREFIX = "NEBULA_SEND:";
const LAUNCHER_PREFIX = "NEBULA_LAUNCHER:";

const LAUNCHER_COLLAPSED = { width: 64, height: 64 };
const LAUNCHER_EXPANDED = { width: 292, height: 428 };

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

let launcherWindow: BrowserWindow | null = null;
let launcherPos: { x: number; y: number; } | null = null;
let launcherExpanded = false;

function getMainWindow(): BrowserWindow | undefined {
    const ours = new Set<BrowserWindow>(windows.values());
    if (launcherWindow) ours.add(launcherWindow);
    return BrowserWindow.getAllWindows().find(w => !ours.has(w));
}

/**
 * The console-message signature changed in Electron 37 (positional args deprecated in
 * favour of a single event object), so read the message defensively either way.
 */
function readConsoleMessage(args: any[]): string {
    return typeof args[2] === "string" ? args[2] : args[0]?.message ?? "";
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

    win.webContents.on("console-message", (...args: any[]) => {
        const message = readConsoleMessage(args);
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

/* ------------------------------- launcher ball ------------------------------ */

function defaultLauncherPos() {
    const work = screen.getPrimaryDisplay().workArea;
    return { x: work.x + 32, y: work.y + 32 };
}

function applyLauncherBounds() {
    if (!launcherWindow || launcherWindow.isDestroyed()) return;

    const size = launcherExpanded ? LAUNCHER_EXPANDED : LAUNCHER_COLLAPSED;
    const work = screen.getPrimaryDisplay().workArea;
    const pos = launcherPos ?? defaultLauncherPos();

    launcherWindow.setBounds({
        x: Math.min(Math.max(pos.x, work.x), work.x + work.width - size.width),
        y: Math.min(Math.max(pos.y, work.y), work.y + work.height - size.height),
        width: size.width,
        height: size.height
    });
}

function handleLauncherAction(payload: any) {
    switch (payload?.action) {
        case "expand":
        case "collapse":
            // click-through/mouse-forwarding tricks for a "hover to become
            // interactive" window are unreliable on Linux/Wayland - instead the
            // window itself is only as big as what's actually drawn (a 64x64 ball
            // when idle), so it never blocks clicks on the game beyond that.
            launcherExpanded = payload.action === "expand";
            applyLauncherBounds();
            break;
        case "togglePin": {
            const mainWin = getMainWindow();
            mainWin?.webContents.executeJavaScript(
                `window.__nebulaLauncherTogglePin && window.__nebulaLauncherTogglePin(${JSON.stringify(payload.itemId)})`
            ).catch(() => {});
            break;
        }
    }
}

function ensureLauncher() {
    if (launcherWindow && !launcherWindow.isDestroyed()) return launcherWindow;

    launcherPos ??= defaultLauncherPos();
    launcherExpanded = false;

    const win = new BrowserWindow({
        ...LAUNCHER_COLLAPSED,
        x: launcherPos.x,
        y: launcherPos.y,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        // focusable:false blocks real mouse clicks too on some Wayland compositors,
        // not just keyboard input (same issue the chat overlay hit earlier) - so this
        // has to be focusable for the ball to be clickable at all.
        show: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    win.setAlwaysOnTop(true, "screen-saver");
    win.loadURL(`data:text/html;base64,${launcherHtml}`);

    win.webContents.on("console-message", (...args: any[]) => {
        const message = readConsoleMessage(args);
        if (!message.startsWith(LAUNCHER_PREFIX)) return;
        try {
            handleLauncherAction(JSON.parse(message.slice(LAUNCHER_PREFIX.length)));
        } catch {
            // ignore malformed bridge messages
        }
    });

    win.on("moved", () => {
        if (!win.isDestroyed()) launcherPos = win.getBounds();
    });

    win.on("closed", () => {
        launcherWindow = null;
    });

    launcherWindow = win;
    return win;
}

export function pushLauncherState(_event: IpcMainInvokeEvent, state: unknown) {
    if (!launcherWindow || launcherWindow.isDestroyed() || !launcherWindow.isVisible()) return;
    launcherWindow.webContents.executeJavaScript(
        `window.__nebulaSetLauncherState && window.__nebulaSetLauncherState(${JSON.stringify(state)})`
    ).catch(() => {});
}

export function syncOverlayItems(_event: IpcMainInvokeEvent, items: OverlayItemMeta[]) {
    ensureLauncher();

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
            positionWindow(win, item);
            if (visible) win.show();
        }
        // deliberately not repositioning existing windows here - the user may have
        // dragged the card somewhere sensible in-game, and snapping it back to the
        // Free Mode window's position every sync tick reads as the feature being broken.
    }
}

function toggleOverlay() {
    visible = !visible;

    for (const win of windows.values()) {
        if (visible) win.show();
        else win.hide();
    }

    const launcher = visible ? ensureLauncher() : launcherWindow;
    if (!launcher || launcher.isDestroyed()) return;

    if (visible) {
        applyLauncherBounds();
        launcher.showInactive();
        // don't wait for the next poll tick - the panel would sit blank for up to 1s
        getMainWindow()?.webContents.executeJavaScript(
            "window.__nebulaForceOverlaySync && window.__nebulaForceOverlaySync()"
        ).catch(() => {});
    } else {
        launcherExpanded = false;
        applyLauncherBounds();
        launcher.hide();
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

    launcherWindow?.close();
    launcherWindow = null;
    launcherExpanded = false;
}

export function pushState(_event: IpcMainInvokeEvent, itemId: string, state: unknown) {
    const win = windows.get(itemId);
    if (!win || win.isDestroyed() || !win.isVisible()) return;
    win.webContents.executeJavaScript(
        `window.__nebulaSetState && window.__nebulaSetState(${JSON.stringify(state)})`
    ).catch(() => {});
}
