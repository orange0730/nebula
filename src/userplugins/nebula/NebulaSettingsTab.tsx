import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Forms } from "@webpack/common";

import { AppearanceSettingsPanel } from "../freeMode/components/AppearanceSettings";
import { LiveThemePanel } from "../liveTheme/components/LiveThemePanel";

function NebulaSettingsTab() {
    return (
        <SettingsTab>
            <Forms.FormText style={{ marginBottom: 20 }}>
                Nebula 自製外掛的統一設定頁面。個別外掛在 Plugins 分頁裡仍然可以單獨開關、也還有自己的設定入口——這裡只是把常用的外觀選項集中放一個地方。
            </Forms.FormText>

            <Forms.FormTitle tag="h3">LiveTheme</Forms.FormTitle>
            <LiveThemePanel />

            <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid var(--background-modifier-accent)" }} />

            <Forms.FormTitle tag="h3">Free Mode 外觀</Forms.FormTitle>
            <AppearanceSettingsPanel />

            <Forms.FormText>
                Free Mode 的版面配置(視窗排列、儲存的版面)請在自由模式疊層裡的「版面」選單管理，不在這裡。
            </Forms.FormText>
        </SettingsTab>
    );
}

export default wrapTab(NebulaSettingsTab, "Nebula");
