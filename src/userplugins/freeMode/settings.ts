import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { AppearanceSettingsPanel } from "./components/AppearanceSettings";
import type { Workspace } from "./workspaces";

export const settings = definePluginSettings({
    workspaces: {
        type: OptionType.CUSTOM,
        default: {} as Record<string, Workspace>
    },
    accentColor: {
        type: OptionType.CUSTOM,
        default: "#8f7bff"
    },
    overlayDarkness: {
        type: OptionType.CUSTOM,
        default: 0.55
    },
    cardOpacity: {
        type: OptionType.CUSTOM,
        default: 0.72
    },
    cardBlur: {
        type: OptionType.CUSTOM,
        default: 18
    },
    appearance: {
        type: OptionType.COMPONENT,
        description: "自由模式外觀",
        component: AppearanceSettingsPanel
    }
});
