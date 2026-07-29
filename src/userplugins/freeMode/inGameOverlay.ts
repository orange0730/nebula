import { findByPropsLazy } from "@webpack";
import { PluginNative } from "@utils/types";
import { SelectedChannelStore } from "@webpack/common";

import { getChannel, getSpeakingParticipantIds, getVoiceStatesForChannel, UserStore, VoiceStateStore } from "./discordApi";

const ChannelRTCStore = findByPropsLazy("getSpeakingParticipants", "getParticipants");

const Native = VencordNative.pluginHelpers.NebulaFreeMode as PluginNative<typeof import("./native")>;

let pollTimer: ReturnType<typeof setInterval> | undefined;

function buildState() {
    const channelId = SelectedChannelStore.getVoiceChannelId();
    if (!channelId) return { channelName: null, participants: [] };

    const channel = getChannel(channelId);
    const voiceStates = getVoiceStatesForChannel(channelId);
    const speakingIds = getSpeakingParticipantIds(channelId);

    const participants = Object.values(voiceStates ?? {})
        .map((state: any) => {
            const user = UserStore.getUser(state.userId);
            if (!user) return null;
            return {
                username: user.username,
                avatarUrl: user.getAvatarURL?.(undefined, 80),
                speaking: speakingIds.has(state.userId)
            };
        })
        .filter(Boolean);

    return { channelName: channel?.name ?? null, participants };
}

function pushState() {
    Native.pushState(buildState());
}

export function startInGameOverlay() {
    Native.registerShortcut();

    pollTimer = setInterval(pushState, 1000);

    SelectedChannelStore.addChangeListener(pushState);
    ChannelRTCStore.addChangeListener(pushState);
    VoiceStateStore.addChangeListener(pushState);
}

export function stopInGameOverlay() {
    Native.unregisterShortcut();

    clearInterval(pollTimer);
    pollTimer = undefined;

    SelectedChannelStore.removeChangeListener(pushState);
    ChannelRTCStore.removeChangeListener(pushState);
    VoiceStateStore.removeChangeListener(pushState);
}
