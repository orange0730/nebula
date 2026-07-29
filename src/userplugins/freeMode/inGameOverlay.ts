import { findByPropsLazy } from "@webpack";
import { PluginNative } from "@utils/types";
import { SelectedChannelStore, showToast, Toasts } from "@webpack/common";

import {
    ensureMessagesLoaded,
    getCachedMessages,
    getChannel,
    getSpeakingParticipantIds,
    getVoiceStatesForChannel,
    GuildStore,
    MessageStore,
    sendChannelMessage,
    UserStore,
    VoiceStateStore
} from "./discordApi";
import { freeModeStore } from "./state";

const ChannelRTCStore = findByPropsLazy("getSpeakingParticipants", "getParticipants");

const Native = VencordNative.pluginHelpers.NebulaFreeMode as PluginNative<typeof import("./native")>;

const CHAT_MESSAGE_LIMIT = 8;

let pollTimer: ReturnType<typeof setInterval> | undefined;
let unsubscribeStore: (() => void) | undefined;

function buildVoicePayload() {
    const channelId = SelectedChannelStore.getVoiceChannelId();
    if (!channelId) return { type: "voice", channelName: null, guildName: null, participants: [] };

    const channel = getChannel(channelId);
    const guildName = channel?.guild_id ? GuildStore.getGuild(channel.guild_id)?.name ?? null : null;
    const voiceStates = getVoiceStatesForChannel(channelId);
    const speakingIds = getSpeakingParticipantIds(channelId);

    const participants = Object.values(voiceStates ?? {})
        .map((state: any) => {
            const user = UserStore.getUser(state.userId);
            if (!user) return null;
            return {
                username: user.username,
                avatarUrl: user.getAvatarURL?.(undefined, 80),
                speaking: speakingIds.has(state.userId),
                muted: !!(state.mute || state.selfMute),
                deafened: !!(state.deaf || state.selfDeaf)
            };
        })
        .filter(Boolean);

    return { type: "voice", channelName: channel?.name ?? null, guildName, participants };
}

function buildChatPayload(channelId: string) {
    ensureMessagesLoaded(channelId);

    const channel = getChannel(channelId);
    const messages = getCachedMessages(channelId)
        .slice(-CHAT_MESSAGE_LIMIT)
        .map((m: any) => {
            const author = UserStore.getUser(m.author?.id) ?? m.author;
            return {
                id: m.id,
                username: author?.username ?? "unknown",
                avatarUrl: author?.getAvatarURL?.(undefined, 40),
                content: m.content ?? ""
            };
        });

    return { type: "chat", channelName: channel?.name ?? null, messages };
}

function syncAndPush() {
    const { overlayItems, windows } = freeModeStore.get();
    const winById = new Map(windows.map(w => [w.id, w]));

    const metas = overlayItems
        .map(item => {
            const win = winById.get(item.id);
            if (!win) return null;
            return { id: item.id, kind: item.kind, x: win.x, y: win.y, width: win.width, height: win.height };
        })
        .filter((m): m is NonNullable<typeof m> => m !== null);

    Native.syncOverlayItems(metas);

    for (const item of overlayItems) {
        if (item.kind === "voiceRoom") {
            Native.pushState(item.id, buildVoicePayload());
        } else if (item.kind === "channel" && item.channelId) {
            Native.pushState(item.id, buildChatPayload(item.channelId));
        }
    }
}

function handleOverlaySend(itemId: string, text: string) {
    const item = freeModeStore.get().overlayItems.find(i => i.id === itemId);
    if (item?.kind === "channel" && item.channelId) {
        sendChannelMessage(item.channelId, text);
    }
}

export function startInGameOverlay() {
    Native.registerShortcut().then(result => {
        if (result?.mode === "electron") {
            showToast(
                "找不到系統的全域快捷鍵支援，Ctrl+Shift+` 只能在 Discord 視窗有 focus 時觸發（常見於 GNOME + Wayland）。",
                Toasts.Type.MESSAGE
            );
        }
    });

    (window as any).__nebulaSendMessage = handleOverlaySend;

    pollTimer = setInterval(syncAndPush, 1000);
    unsubscribeStore = freeModeStore.subscribe(syncAndPush);

    SelectedChannelStore.addChangeListener(syncAndPush);
    ChannelRTCStore.addChangeListener(syncAndPush);
    VoiceStateStore.addChangeListener(syncAndPush);
    MessageStore.addChangeListener(syncAndPush);
}

export function stopInGameOverlay() {
    Native.unregisterShortcut();

    delete (window as any).__nebulaSendMessage;

    clearInterval(pollTimer);
    pollTimer = undefined;
    unsubscribeStore?.();
    unsubscribeStore = undefined;

    SelectedChannelStore.removeChangeListener(syncAndPush);
    ChannelRTCStore.removeChangeListener(syncAndPush);
    VoiceStateStore.removeChangeListener(syncAndPush);
    MessageStore.removeChangeListener(syncAndPush);
}
