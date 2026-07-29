import { freeModeStore, FreeWindow, WindowKind } from "./state";
import { settings } from "./settings";

export interface SavedWindow {
    kind: WindowKind;
    title: string;
    channelId?: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Workspace {
    name: string;
    windows: SavedWindow[];
}

function toSaved(w: FreeWindow): SavedWindow {
    return { kind: w.kind, title: w.title, channelId: w.channelId, x: w.x, y: w.y, width: w.width, height: w.height };
}

export function listWorkspaceNames(): string[] {
    return Object.keys(settings.store.workspaces ?? {});
}

export function saveWorkspace(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const windows = freeModeStore.get().windows.filter(w => !w.minimized).map(toSaved);
    settings.store.workspaces = {
        ...settings.store.workspaces,
        [trimmed]: { name: trimmed, windows }
    };
}

export function deleteWorkspace(name: string) {
    const next = { ...settings.store.workspaces };
    delete next[name];
    settings.store.workspaces = next;
}

export function loadWorkspace(name: string) {
    const ws: Workspace | undefined = settings.store.workspaces?.[name];
    if (!ws) return;

    freeModeStore.set(s => {
        let z = s.nextZIndex;
        let idCounter = s.idCounter;
        const windows: FreeWindow[] = ws.windows.map(sw => {
            const win: FreeWindow = {
                id: `fw-${idCounter}`,
                kind: sw.kind,
                title: sw.title,
                channelId: sw.channelId,
                x: sw.x,
                y: sw.y,
                width: sw.width,
                height: sw.height,
                zIndex: z,
                minimized: false,
                hasActivity: false
            };
            idCounter++;
            z++;
            return win;
        });

        return {
            ...s,
            windows,
            focusedId: windows.length ? windows[windows.length - 1].id : null,
            nextZIndex: z,
            idCounter
        };
    });
}
