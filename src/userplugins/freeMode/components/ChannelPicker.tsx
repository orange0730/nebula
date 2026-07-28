import { classNameFactory } from "@utils/css";
import { useMemo, useState } from "@webpack/common";

import { listGuildTextChannels, listPrivateChannels, PickableChannel } from "../discordApi";
import { addWindow } from "../state";

const cl = classNameFactory("nebula-picker-");

interface Props {
    onClose: () => void;
}

export function ChannelPicker({ onClose }: Props) {
    const [query, setQuery] = useState("");

    const channels = useMemo<PickableChannel[]>(() => {
        return [...listPrivateChannels(), ...listGuildTextChannels()];
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return channels.slice(0, 60);
        return channels.filter(c =>
            c.name.toLowerCase().includes(q) || (c.guildName?.toLowerCase().includes(q) ?? false)
        ).slice(0, 60);
    }, [channels, query]);

    const pick = (channel: PickableChannel) => {
        addWindow("channel", {
            title: channel.guildName ? `${channel.name}` : channel.name,
            channelId: channel.id
        });
        onClose();
    };

    const addWidget = (kind: "voiceRoom" | "clock" | "weather", title: string) => {
        addWindow(kind, { title });
        onClose();
    };

    return (
        <div className={cl("root")} onPointerDown={e => e.stopPropagation()}>
            <input
                className={cl("search")}
                autoFocus
                placeholder="搜尋頻道或私訊..."
                value={query}
                onChange={e => setQuery(e.target.value)}
            />
            <div className={cl("widget-row")}>
                <button className={cl("widget-btn")} onClick={() => addWidget("voiceRoom", "語音室")}>語音室</button>
                <button className={cl("widget-btn")} onClick={() => addWidget("clock", "時鐘")}>時鐘</button>
                <button className={cl("widget-btn")} onClick={() => addWidget("weather", "天氣")}>天氣</button>
            </div>
            <div className={cl("list")}>
                {filtered.map(c => (
                    <div key={c.id} className={cl("item")} onClick={() => pick(c)}>
                        <span className={cl("item-name")}>{c.isDM ? "@ " : "# "}{c.name}</span>
                        {c.guildName && <span className={cl("item-guild")}>{c.guildName}</span>}
                    </div>
                ))}
                {filtered.length === 0 && <div className={cl("item-empty")}>找不到符合的頻道</div>}
            </div>
        </div>
    );
}
