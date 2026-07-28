import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { freeModeStore, FreeWindow, WindowKind } from "./state";

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

export const workspaceSettings = definePluginSettings({
    workspaces: {
        type: OptionType.CUSTOM,
        default: {} as Record<string, Workspace>
    }
});

function toSaved(w: FreeWindow): SavedWindow {
    return { kind: w.kind, title: w.title, channelId: w.channelId, x: w.x, y: w.y, width: w.width, height: w.height };
}

export function listWorkspaceNames(): string[] {
    return Object.keys(workspaceSettings.store.workspaces ?? {});
}

export function saveWorkspace(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const windows = freeModeStore.get().windows.filter(w => !w.minimized).map(toSaved);
    workspaceSettings.store.workspaces = {
        ...workspaceSettings.store.workspaces,
        [trimmed]: { name: trimmed, windows }
    };
}

export function deleteWorkspace(name: string) {
    const next = { ...workspaceSettings.store.workspaces };
    delete next[name];
    workspaceSettings.store.workspaces = next;
}

export function loadWorkspace(name: string) {
    const ws: Workspace | undefined = workspaceSettings.store.workspaces?.[name];
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
