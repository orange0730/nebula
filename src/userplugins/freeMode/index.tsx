import "./styles.css";

import { createRoot } from "@webpack/common";
import definePlugin from "@utils/types";

import { EntryButton } from "./components/EntryButton";
import { FreeModeOverlay } from "./components/FreeModeOverlay";
import { startGlobalShortcut, stopGlobalShortcut } from "./globalShortcut";
import { workspaceSettings } from "./workspaces";

const ROOT_ID = "vc-nebula-freemode-root";

let root: ReturnType<typeof createRoot> | undefined;

function mount() {
    let container = document.getElementById(ROOT_ID);
    if (!container) {
        container = document.createElement("div");
        container.id = ROOT_ID;
        document.body.appendChild(container);
    }

    root = createRoot(container);
    root.render(
        <>
            <EntryButton />
            <FreeModeOverlay />
        </>
    );

    startGlobalShortcut();
}

function unmount() {
    stopGlobalShortcut();
    root?.unmount();
    root = undefined;
    document.getElementById(ROOT_ID)?.remove();
}

export default definePlugin({
    name: "NebulaFreeMode",
    description: "自由模式：可自由拖放/縮放的多視窗聊天版面，支援多個頻道/私訊同時開啟，並可加入時鐘、天氣、語音室等小工具。",
    authors: [{ name: "orange980730", id: 0n }],
    tags: ["Appearance", "Utility"],
    settings: workspaceSettings,

    start: mount,
    stop: unmount
});
