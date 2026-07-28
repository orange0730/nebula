import { sendMessage } from "@utils/discord";
import { findByPropsLazy } from "@webpack";
import {
    ChannelStore,
    GuildChannelStore,
    GuildStore,
    MessageStore,
    PresenceStore,
    ReadStateStore,
    RelationshipStore,
    UserStore,
    VoiceStateStore
} from "@webpack/common";

const MessageActionsFetch = findByPropsLazy("fetchMessages", "loadSelectedChannelIfNecessary");
const ChannelAckActions = findByPropsLazy("ack", "bulkAck");
const ChannelRTCStore = findByPropsLazy("getSpeakingParticipants", "getParticipants");

export { ChannelStore, GuildChannelStore, GuildStore, MessageStore, PresenceStore, ReadStateStore, RelationshipStore, UserStore, VoiceStateStore };

export interface PickableChannel {
    id: string;
    name: string;
    guildId?: string;
    guildName?: string;
    isDM: boolean;
    isVoice: boolean;
}

export function listGuildTextChannels(): PickableChannel[] {
    const out: PickableChannel[] = [];
    for (const guild of Object.values(GuildStore.getGuilds() as Record<string, any>)) {
        const channels = GuildChannelStore.getChannels(guild.id);
        for (const { channel } of channels?.SELECTABLE ?? []) {
            out.push({ id: channel.id, name: channel.name, guildId: guild.id, guildName: guild.name, isDM: false, isVoice: false });
        }
    }
    return out;
}

export function listVoiceChannels(): PickableChannel[] {
    const out: PickableChannel[] = [];
    for (const guild of Object.values(GuildStore.getGuilds() as Record<string, any>)) {
        const channels = GuildChannelStore.getChannels(guild.id);
        for (const { channel } of channels?.VOCAL ?? []) {
            out.push({ id: channel.id, name: channel.name, guildId: guild.id, guildName: guild.name, isDM: false, isVoice: true });
        }
    }
    return out;
}

export function listPrivateChannels(): PickableChannel[] {
    return ChannelStore.getSortedPrivateChannels().map((channel: any) => ({
        id: channel.id,
        name: channel.name || getRecipientNames(channel),
        isDM: true,
        isVoice: false
    }));
}

function getRecipientNames(channel: any): string {
    const ids: string[] = channel.recipients ?? [];
    return ids.map(id => UserStore.getUser(id)?.username ?? "未知使用者").join(", ") || "私訊";
}

export function getChannel(channelId: string) {
    return ChannelStore.getChannel(channelId);
}

export function getCachedMessages(channelId: string) {
    return MessageStore.getMessages(channelId)?._array ?? [];
}

export function ensureMessagesLoaded(channelId: string) {
    if (getCachedMessages(channelId).length > 0) return;
    MessageActionsFetch.fetchMessages({ channelId, limit: 50 });
}

export function sendChannelMessage(channelId: string, content: string) {
    if (!content.trim()) return;
    sendMessage(channelId, { content });
}

export function ackChannel(channelId: string) {
    try {
        ChannelAckActions.ack(channelId);
    } catch {
        // best-effort only - never let a failed read-state ack break the window
    }
}

export function getSpeakingParticipantIds(channelId: string): Set<string> {
    try {
        const speaking = ChannelRTCStore.getSpeakingParticipants(channelId) ?? [];
        return new Set(speaking.map((p: any) => p.userId ?? p.id));
    } catch {
        return new Set();
    }
}

export function getVoiceStatesForChannel(channelId: string): Record<string, any> {
    return VoiceStateStore.getVoiceStatesForChannel(channelId) ?? {};
}
