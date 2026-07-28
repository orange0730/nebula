import { useEffect, useReducer } from "@webpack/common";

export function createExternalStore<T>(initial: T) {
    let state = initial;
    const listeners = new Set<() => void>();

    return {
        get: () => state,
        set(updater: T | ((prev: T) => T)) {
            state = typeof updater === "function" ? (updater as (prev: T) => T)(state) : updater;
            listeners.forEach(l => l());
        },
        subscribe(fn: () => void) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        }
    };
}

export function useExternalStore<T>(store: ReturnType<typeof createExternalStore<T>>): T {
    const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
    useEffect(() => {
        const unsubscribe = store.subscribe(forceUpdate);
        return () => { unsubscribe(); };
    }, [store]);
    return store.get();
}

export type WindowKind = "channel" | "voiceRoom" | "clock" | "weather" | "empty";

export interface FreeWindow {
    id: string;
    kind: WindowKind;
    title: string;
    channelId?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    minimized: boolean;
    /** bumped whenever a new message arrives while this window isn't focused */
    hasActivity: boolean;
}

export interface FreeModeState {
    isOpen: boolean;
    windows: FreeWindow[];
    focusedId: string | null;
    nextZIndex: number;
    idCounter: number;
}

const INITIAL_STATE: FreeModeState = {
    isOpen: false,
    windows: [],
    focusedId: null,
    nextZIndex: 1,
    idCounter: 1
};

export const freeModeStore = createExternalStore<FreeModeState>(INITIAL_STATE);

export function openFreeMode() {
    freeModeStore.set(s => ({ ...s, isOpen: true }));
}

export function closeFreeMode() {
    freeModeStore.set(s => ({ ...s, isOpen: false }));
}

export function toggleFreeMode() {
    freeModeStore.set(s => ({ ...s, isOpen: !s.isOpen }));
}

const DEFAULT_SIZE: Record<WindowKind, { width: number; height: number; }> = {
    channel: { width: 420, height: 520 },
    voiceRoom: { width: 320, height: 220 },
    clock: { width: 260, height: 180 },
    weather: { width: 300, height: 220 },
    empty: { width: 360, height: 320 }
};

export function addWindow(kind: WindowKind, opts: { title: string; channelId?: string; }) {
    freeModeStore.set(s => {
        const size = DEFAULT_SIZE[kind];
        const offset = (s.windows.length % 8) * 42;
        const win: FreeWindow = {
            id: `fw-${s.idCounter}`,
            kind,
            title: opts.title,
            channelId: opts.channelId,
            x: 120 + offset,
            y: 90 + offset,
            width: size.width,
            height: size.height,
            zIndex: s.nextZIndex,
            minimized: false,
            hasActivity: false
        };
        return {
            ...s,
            windows: [...s.windows, win],
            focusedId: win.id,
            nextZIndex: s.nextZIndex + 1,
            idCounter: s.idCounter + 1
        };
    });
}

export function closeWindow(id: string) {
    freeModeStore.set(s => ({
        ...s,
        windows: s.windows.filter(w => w.id !== id),
        focusedId: s.focusedId === id ? null : s.focusedId
    }));
}

export function toggleMinimize(id: string) {
    freeModeStore.set(s => ({
        ...s,
        windows: s.windows.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w)
    }));
}

export function focusWindow(id: string) {
    freeModeStore.set(s => {
        if (s.focusedId === id) return s;
        return {
            ...s,
            focusedId: id,
            nextZIndex: s.nextZIndex + 1,
            windows: s.windows.map(w => w.id === id ? { ...w, zIndex: s.nextZIndex, hasActivity: false } : w)
        };
    });
}

export function markActivity(channelId: string) {
    freeModeStore.set(s => ({
        ...s,
        windows: s.windows.map(w =>
            w.kind === "channel" && w.channelId === channelId && w.id !== s.focusedId
                ? { ...w, hasActivity: true }
                : w
        )
    }));
}

export function updateWindowRect(id: string, rect: Partial<Pick<FreeWindow, "x" | "y" | "width" | "height">>) {
    freeModeStore.set(s => ({
        ...s,
        windows: s.windows.map(w => w.id === id ? { ...w, ...rect } : w)
    }));
}

export function cycleFocus(direction: 1 | -1) {
    freeModeStore.set(s => {
        const visible = s.windows.filter(w => !w.minimized);
        if (visible.length === 0) return s;

        const currentIndex = visible.findIndex(w => w.id === s.focusedId);
        const nextIndex = currentIndex === -1
            ? 0
            : (currentIndex + direction + visible.length) % visible.length;
        const nextId = visible[nextIndex].id;

        return {
            ...s,
            focusedId: nextId,
            nextZIndex: s.nextZIndex + 1,
            windows: s.windows.map(w => w.id === nextId ? { ...w, zIndex: s.nextZIndex, hasActivity: false } : w)
        };
    });
}
