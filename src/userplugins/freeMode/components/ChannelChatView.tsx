import { classNameFactory } from "@utils/css";
import { Avatar, FluxDispatcher, useEffect, useReducer, useRef, useState } from "@webpack/common";

import {
    ackChannel,
    ensureMessagesLoaded,
    getCachedMessages,
    PresenceStore,
    sendChannelMessage
} from "../discordApi";

const cl = classNameFactory("nebula-chat-");

function formatTime(timestamp: string | number) {
    const d = new Date(timestamp);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

interface Props {
    channelId: string;
}

export function ChannelChatView({ channelId }: Props) {
    const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
    const [draft, setDraft] = useState("");
    const scrollerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ensureMessagesLoaded(channelId);
        ackChannel(channelId);

        const onMessage = (e: any) => {
            const eventChannelId = e.channelId ?? e.message?.channel_id;
            if (eventChannelId !== channelId) return;
            forceUpdate();
            ackChannel(channelId);
        };

        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
        FluxDispatcher.subscribe("MESSAGE_UPDATE", onMessage);
        FluxDispatcher.subscribe("MESSAGE_DELETE", onMessage);
        FluxDispatcher.subscribe("LOAD_MESSAGES_SUCCESS", onMessage);

        return () => {
            FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
            FluxDispatcher.unsubscribe("MESSAGE_UPDATE", onMessage);
            FluxDispatcher.unsubscribe("MESSAGE_DELETE", onMessage);
            FluxDispatcher.unsubscribe("LOAD_MESSAGES_SUCCESS", onMessage);
        };
    }, [channelId]);

    const messages = getCachedMessages(channelId);

    useEffect(() => {
        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
    }, [messages.length]);

    const onSend = () => {
        if (!draft.trim()) return;
        sendChannelMessage(channelId, draft);
        setDraft("");
    };

    return (
        <div className={cl("root")}>
            <div ref={scrollerRef} className={cl("scroller")}>
                {messages.length === 0 && <div className={cl("empty")}>還沒有訊息</div>}
                {messages.map((msg: any) => (
                    <MessageRow key={msg.id} message={msg} />
                ))}
            </div>
            <div className={cl("composer")}>
                <textarea
                    className={cl("input")}
                    value={draft}
                    placeholder="輸入訊息..."
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                        }
                    }}
                    rows={1}
                />
            </div>
        </div>
    );
}

function MessageRow({ message }: { message: any; }) {
    const author = message.author;
    const status = author ? PresenceStore.getStatus(author.id) : "offline";
    const avatarUrl = author?.getAvatarURL?.(undefined, 80) ?? undefined;

    return (
        <div className={cl("message")}>
            <Avatar
                className={cl("avatar")}
                src={avatarUrl}
                size="SIZE_32"
                status={status}
            />
            <div className={cl("message-body")}>
                <div className={cl("message-header")}>
                    <span className={cl("author")}>{author?.username ?? "未知"}</span>
                    <span className={cl("timestamp")}>{formatTime(message.timestamp)}</span>
                </div>
                <div className={cl("content")}>{message.content}</div>
            </div>
        </div>
    );
}
