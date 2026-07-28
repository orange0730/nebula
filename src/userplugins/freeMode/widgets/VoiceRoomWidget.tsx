import { classNameFactory } from "@utils/css";
import { findByPropsLazy } from "@webpack";
import { Avatar, SelectedChannelStore, useStateFromStores, VoiceStateStore } from "@webpack/common";

import { getChannel, PresenceStore, UserStore } from "../discordApi";

const cl = classNameFactory("nebula-voice-");

const ChannelRTCStore = findByPropsLazy("getSpeakingParticipants", "getParticipants");

export function VoiceRoomWidget() {
    const channelId = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getVoiceChannelId());

    const voiceStates = useStateFromStores(
        [VoiceStateStore],
        () => channelId ? VoiceStateStore.getVoiceStatesForChannel(channelId) : null,
        [channelId]
    );

    const speakingIds: Set<string> = useStateFromStores(
        [ChannelRTCStore],
        () => channelId ? new Set(ChannelRTCStore.getSpeakingParticipants(channelId).map((p: any) => p.userId ?? p.id)) : new Set(),
        [channelId]
    );

    if (!channelId) {
        return <div className={cl("empty")}>目前沒有加入語音頻道</div>;
    }

    const channel = getChannel(channelId);
    const participants = Object.values(voiceStates ?? {});

    return (
        <div className={cl("root")}>
            <div className={cl("title")}>{channel?.name ?? "語音頻道"}</div>
            <div className={cl("grid")}>
                {participants.map((state: any) => {
                    const user = UserStore.getUser(state.userId);
                    if (!user) return null;
                    const speaking = speakingIds.has(state.userId);
                    return (
                        <div key={state.userId} className={cl("participant")}>
                            <div className={`${cl("avatar-ring")} ${speaking ? cl("speaking") : ""}`}>
                                <Avatar
                                    src={user.getAvatarURL?.(undefined, 80)}
                                    size="SIZE_40"
                                    status={PresenceStore.getStatus(user.id)}
                                />
                            </div>
                            <span className={cl("name")}>{user.username}</span>
                        </div>
                    );
                })}
                {participants.length === 0 && <div className={cl("empty")}>頻道裡沒有人</div>}
            </div>
        </div>
    );
}
