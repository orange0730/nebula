import { classNameFactory } from "@utils/css";
import { useEffect, useState } from "@webpack/common";

import { closeFreeMode, cycleFocus, freeModeStore, useExternalStore } from "../state";
import { ChannelPicker } from "./ChannelPicker";
import { Window } from "./Window";
import { WorkspaceMenu } from "./WorkspaceMenu";

const cl = classNameFactory("nebula-overlay-");

export function FreeModeOverlay() {
    const state = useExternalStore(freeModeStore);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [wsMenuOpen, setWsMenuOpen] = useState(false);

    useEffect(() => {
        if (!state.isOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement;
            const isTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");

            if (e.key === "Tab" && !isTyping) {
                e.preventDefault();
                cycleFocus(e.shiftKey ? -1 : 1);
            } else if (e.key === "Escape") {
                if (pickerOpen) setPickerOpen(false);
                else if (wsMenuOpen) setWsMenuOpen(false);
                else if (!isTyping) closeFreeMode();
            }
        };

        document.addEventListener("keydown", onKeyDown, true);
        return () => document.removeEventListener("keydown", onKeyDown, true);
    }, [state.isOpen, pickerOpen, wsMenuOpen]);

    if (!state.isOpen) return null;

    return (
        <div className="nebula-overlay" onPointerDown={() => { setPickerOpen(false); setWsMenuOpen(false); }}>
            <div className={cl("toolbar")}>
                <button
                    className="nebula-toolbar-btn"
                    onPointerDown={e => { e.stopPropagation(); setWsMenuOpen(false); setPickerOpen(v => !v); }}
                >
                    ＋ 新增視窗
                </button>
                <button
                    className="nebula-toolbar-btn"
                    onPointerDown={e => { e.stopPropagation(); setPickerOpen(false); setWsMenuOpen(v => !v); }}
                >
                    版面
                </button>
                <span style={{ color: "#8f88b8", fontSize: 12 }}>Tab 切換視窗・Esc 關閉</span>
                <button className="nebula-toolbar-close" onClick={closeFreeMode} title="離開自由模式">
                    &times;
                </button>
            </div>

            {pickerOpen && <ChannelPicker onClose={() => setPickerOpen(false)} />}
            {wsMenuOpen && <WorkspaceMenu onClose={() => setWsMenuOpen(false)} />}

            {state.windows.map(win => (
                <Window key={win.id} win={win} isFocused={win.id === state.focusedId} />
            ))}

            {state.windows.length === 0 && !pickerOpen && (
                <div className={cl("hint")}>
                    按左上角「＋ 新增視窗」開始加入頻道、私訊或小工具
                </div>
            )}
        </div>
    );
}
