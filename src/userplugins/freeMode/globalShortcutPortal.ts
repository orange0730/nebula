import { MessageBus, sessionBus, Variant } from "dbus-next";

const BUS_NAME = "org.freedesktop.portal.Desktop";
const OBJECT_PATH = "/org/freedesktop/portal/desktop";
const REQUEST_IFACE = "org.freedesktop.portal.Request";
const GLOBAL_SHORTCUTS_IFACE = "org.freedesktop.portal.GlobalShortcuts";
const SESSION_IFACE = "org.freedesktop.portal.Session";
const SHORTCUT_ID = "toggle-overlay";
const REQUEST_TIMEOUT_MS = 8000;

let bus: MessageBus | null = null;
let shortcutsIface: any = null;
let sessionObjPath: string | null = null;
let activateCallback: (() => void) | null = null;
let activatedHandler: ((...args: any[]) => void) | null = null;

function token(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

function firstOrSelf<T>(value: T | [T]): T {
    return Array.isArray(value) ? value[0] : value;
}

async function waitForResponse(bus: MessageBus, requestPath: string): Promise<{ code: number; results: Record<string, any>; }> {
    const requestObj = await bus.getProxyObject(BUS_NAME, requestPath);
    const requestIface = requestObj.getInterface(REQUEST_IFACE);

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("portal request timed out")), REQUEST_TIMEOUT_MS);
        requestIface.once("Response", (code: number, results: Record<string, any>) => {
            clearTimeout(timer);
            resolve({ code, results });
        });
    });
}

/**
 * Tries to bind the overlay toggle through the xdg-desktop-portal GlobalShortcuts
 * interface, which is the only mechanism that can capture a hotkey outside the app's
 * own window under Wayland. Not every compositor implements this portal (notably,
 * GNOME's stock xdg-desktop-portal-gnome does not as of writing) - callers should fall
 * back to Electron's globalShortcut (works on X11, and while the app is focused
 * everywhere) when this returns ok: false.
 */
export async function tryRegisterPortalShortcut(onActivate: () => void): Promise<{ ok: boolean; reason?: string; }> {
    if (process.platform !== "linux") {
        return { ok: false, reason: "not-linux" };
    }

    try {
        bus = sessionBus();

        const desktopObj = await bus.getProxyObject(BUS_NAME, OBJECT_PATH);
        shortcutsIface = desktopObj.getInterface(GLOBAL_SHORTCUTS_IFACE);

        const sessionToken = token("nebula_session");
        const requestToken = token("nebula_request");

        const createResult = await shortcutsIface.CreateSession({
            handle_token: new Variant("s", requestToken),
            session_handle_token: new Variant("s", sessionToken)
        });
        const createRequestPath = firstOrSelf(createResult);

        const createResponse = await waitForResponse(bus, createRequestPath);
        if (createResponse.code !== 0) {
            return { ok: false, reason: `create-session-failed:${createResponse.code}` };
        }

        sessionObjPath = createResponse.results.session_handle.value;

        const bindRequestToken = token("nebula_bind");
        const bindResult = await shortcutsIface.BindShortcuts(
            sessionObjPath,
            [[SHORTCUT_ID, { description: new Variant("s", "Toggle Nebula in-game overlay") }]],
            "",
            { handle_token: new Variant("s", bindRequestToken) }
        );
        const bindRequestPath = firstOrSelf(bindResult);

        const bindResponse = await waitForResponse(bus, bindRequestPath);
        if (bindResponse.code !== 0) {
            return { ok: false, reason: `bind-shortcuts-failed:${bindResponse.code}` };
        }

        activateCallback = onActivate;
        activatedHandler = (activatedSession: string, shortcutId: string) => {
            if (activatedSession === sessionObjPath && shortcutId === SHORTCUT_ID) {
                activateCallback?.();
            }
        };
        shortcutsIface.on("Activated", activatedHandler);

        return { ok: true };
    } catch (e) {
        return { ok: false, reason: e instanceof Error ? e.message : String(e) };
    }
}

export async function unregisterPortalShortcut() {
    if (shortcutsIface && activatedHandler) {
        shortcutsIface.off("Activated", activatedHandler);
    }
    activatedHandler = null;
    activateCallback = null;

    if (bus && sessionObjPath) {
        try {
            const sessionObj = await bus.getProxyObject(BUS_NAME, sessionObjPath);
            const sessionIface = sessionObj.getInterface(SESSION_IFACE);
            await sessionIface.Close();
        } catch {
            // best-effort only - the session bus connection may already be gone
        }
    }

    sessionObjPath = null;
    shortcutsIface = null;
    bus?.disconnect();
    bus = null;
}
