import { classNameFactory } from "@utils/css";
import { useEffect, useState } from "@webpack/common";

const cl = classNameFactory("nebula-clock-");

export function ClockWidget() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const date = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

    return (
        <div className={cl("root")}>
            <div className={cl("time")}>{time}</div>
            <div className={cl("date")}>{date}</div>
        </div>
    );
}
