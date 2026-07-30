import { classNameFactory } from "@utils/css";
import type { PointerEvent as ReactPointerEvent } from "react";
import { showToast, Toasts, useCallback, useState } from "@webpack/common";

import { ClockWidget } from "../widgets/ClockWidget";
import { WeatherWidget } from "../widgets/WeatherWidget";
import { VoiceRoomWidget } from "../widgets/VoiceRoomWidget";
import { ChannelChatView } from "./ChannelChatView";
import { closeWindow, focusWindow, freeModeStore, FreeWindow, pinToOverlay, toggleMinimize, unpinFromOverlay, updateWindowRect, useExternalStore } from "../state";

const cl = classNameFactory("nebula-");

const MIN_WIDTH = 240;
const MIN_HEIGHT = 160;
const MAX_WIDTH = 900;
const MAX_HEIGHT = 760;

let hasShownPinHint = false;

interface Props {
    win: FreeWindow;
    isFocused: boolean;
}

const CLOSE_ANIM_MS = 140;

export function Window({ win, isFocused }: Props) {
    const overlayItems = useExternalStore(freeModeStore).overlayItems;
    const pinnable = win.kind === "channel" || win.kind === "voiceRoom";
    const pinned = pinnable && overlayItems.some(i => i.id === win.id);
    const [closing, setClosing] = useState(false);
    // The single source of truth for position/size while actively dragging or
    // resizing. Without this, directly mutating el.style bypasses React, and any
    // unrelated store update mid-drag (a new message, another window focusing)
    // re-renders this element from the still-stale win.x/win.y and snaps it back.
    const [liveRect, setLiveRect] = useState<Partial<Pick<FreeWindow, "x" | "y" | "width" | "height">> | null>(null);

    const requestClose = useCallback(() => {
        setClosing(true);
        setTimeout(() => closeWindow(win.id), CLOSE_ANIM_MS);
    }, [win.id]);

    const onDragStart = useCallback((e: React.PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        focusWindow(win.id);

        const startX = e.clientX;
        const startY = e.clientY;
        const origX = win.x;
        const origY = win.y;

        const onMove = (ev: PointerEvent) => {
            setLiveRect({ x: origX + (ev.clientX - startX), y: origY + (ev.clientY - startY) });
        };
        const onUp = (ev: PointerEvent) => {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
            setLiveRect(null);
            updateWindowRect(win.id, {
                x: origX + (ev.clientX - startX),
                y: origY + (ev.clientY - startY)
            });
        };
        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
    }, [win.id, win.x, win.y]);

    const onResizeStart = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        focusWindow(win.id);

        const startX = e.clientX;
        const startY = e.clientY;
        const origW = win.width;
        const origH = win.height;

        const clampWidth = (w: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w));
        const clampHeight = (h: number) => Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, h));

        const onMove = (ev: PointerEvent) => {
            setLiveRect({
                width: clampWidth(origW + (ev.clientX - startX)),
                height: clampHeight(origH + (ev.clientY - startY))
            });
        };
        const onUp = (ev: PointerEvent) => {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
            setLiveRect(null);
            updateWindowRect(win.id, {
                width: clampWidth(origW + (ev.clientX - startX)),
                height: clampHeight(origH + (ev.clientY - startY))
            });
        };
        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
    }, [win.id, win.width, win.height]);

    if (win.minimized) return null;

    return (
        <div
            className={`${cl("window")} ${isFocused ? cl("focused") : ""} ${win.hasActivity ? cl("activity") : ""} ${closing ? cl("closing") : ""}`}
            style={{
                left: liveRect?.x ?? win.x,
                top: liveRect?.y ?? win.y,
                width: liveRect?.width ?? win.width,
                height: liveRect?.height ?? win.height,
                zIndex: win.zIndex
            }}
            onPointerDownCapture={() => focusWindow(win.id)}
        >
            <div className={cl("window-titlebar")} onPointerDown={onDragStart}>
                <span className={cl("window-title")}>{win.title}</span>
                <div className={cl("window-controls")}>
                    {pinnable && (
                        <button
                            className={`${cl("window-btn")} ${pinned ? cl("pinned") : ""}`}
                            onClick={() => {
                                if (pinned) {
                                    unpinFromOverlay(win.id);
                                } else {
                                    pinToOverlay(win);
                                    if (!hasShownPinHint) {
                                        hasShownPinHint = true;
                                        showToast("已釘選。遊戲中按 Ctrl+Shift+` 呼出 Overlay", Toasts.Type.SUCCESS);
                                    }
                                }
                            }}
                            title={pinned ? "從遊戲內 Overlay 移除" : "加到遊戲內 Overlay"}
                            aria-label={pinned ? "從遊戲內 Overlay 移除" : "加到遊戲內 Overlay"}
                            aria-pressed={pinned}
                        >
                            <PinIcon />
                        </button>
                    )}
                    <button className={cl("window-btn")} onClick={() => toggleMinimize(win.id)} title="最小化">
                        &minus;
                    </button>
                    <button className={`${cl("window-btn")} ${cl("close")}`} onClick={requestClose} title="關閉">
                        &times;
                    </button>
                </div>
            </div>
            <div className={cl("window-body")}>
                <WindowBody win={win} />
            </div>
            <div className={cl("resize-handle")} onPointerDown={onResizeStart} />
        </div>
    );
}

function WindowBody({ win }: { win: FreeWindow; }) {
    switch (win.kind) {
        case "channel":
            return win.channelId ? <ChannelChatView channelId={win.channelId} /> : <EmptyBody text="沒有指定頻道" />;
        case "voiceRoom":
            return <VoiceRoomWidget />;
        case "clock":
            return <ClockWidget />;
        case "weather":
            return <WeatherWidget />;
        default:
            return <EmptyBody text="空視窗" />;
    }
}

function EmptyBody({ text }: { text: string; }) {
    return <div className={cl("empty-placeholder")}>{text}</div>;
}

function PinIcon() {
    return (
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <path d="M14.15 2.15a1 1 0 0 1 1.41 0l6.29 6.29a1 1 0 0 1 0 1.41l-1.06 1.06a1 1 0 0 1-1.41 0l-.24-.24-3.3 3.3.68 3.06a1 1 0 0 1-.27.94l-.71.71a1 1 0 0 1-1.41 0l-3.18-3.18-4.6 4.6a1 1 0 0 1-1.41-1.41l4.6-4.6-3.18-3.18a1 1 0 0 1 0-1.41l.71-.71a1 1 0 0 1 .94-.27l3.06.68 3.3-3.3-.24-.24a1 1 0 0 1 0-1.41Z" />
        </svg>
    );
}
