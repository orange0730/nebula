import SettingsPlugin from "@plugins/_core/settings";
import { removeFromArray } from "@utils/misc";
import definePlugin from "@utils/types";

import { NebulaIcon } from "./icon";
import NebulaSettingsTab from "./NebulaSettingsTab";

const ENTRY_KEY = "nebula_settings";

export default definePlugin({
    name: "Nebula",
    description: "在設定側欄加入獨立的「Nebula」分頁，集中管理 LiveTheme 與 Free Mode 的常用外觀設定。",
    authors: [{ name: "orange980730", id: 0n }],
    tags: ["Appearance", "Utility"],

    start() {
        SettingsPlugin.customEntries.push({
            key: ENTRY_KEY,
            title: "Nebula",
            panelTitle: "Nebula",
            Component: NebulaSettingsTab,
            Icon: NebulaIcon
        });
    },

    stop() {
        removeFromArray(SettingsPlugin.customEntries, e => e.key === ENTRY_KEY);
    }
});
