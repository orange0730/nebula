import { classNameFactory } from "@utils/css";
import { useEffect, useState } from "@webpack/common";

const cl = classNameFactory("nebula-weather-");

const DEFAULT_LAT = 25.033;
const DEFAULT_LON = 121.5654;

interface WeatherData {
    temperature: number;
    weatherCode: number;
}

const WEATHER_CODE_LABEL: Record<number, string> = {
    0: "晴朗", 1: "晴時多雲", 2: "多雲", 3: "陰天",
    45: "有霧", 48: "有霧",
    51: "毛毛雨", 53: "毛毛雨", 55: "毛毛雨",
    61: "小雨", 63: "中雨", 65: "大雨",
    71: "小雪", 73: "中雪", 75: "大雪",
    80: "陣雨", 81: "陣雨", 82: "強陣雨",
    95: "雷雨", 96: "雷雨", 99: "雷雨"
};

function describeCode(code: number) {
    return WEATHER_CODE_LABEL[code] ?? "未知天氣";
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
        const json = await res.json();
        return {
            temperature: json.current.temperature_2m,
            weatherCode: json.current.weather_code
        };
    } catch {
        return null;
    }
}

export function WeatherWidget() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        function load(lat: number, lon: number) {
            fetchWeather(lat, lon).then(data => {
                if (!cancelled) {
                    setWeather(data);
                    setLoading(false);
                }
            });
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => load(pos.coords.latitude, pos.coords.longitude),
                () => load(DEFAULT_LAT, DEFAULT_LON),
                { timeout: 4000 }
            );
        } else {
            load(DEFAULT_LAT, DEFAULT_LON);
        }

        const interval = setInterval(() => load(DEFAULT_LAT, DEFAULT_LON), 10 * 60 * 1000);
        return () => { cancelled = true; clearInterval(interval); };
    }, []);

    return (
        <div className={cl("root")}>
            {loading && <div className={cl("status")}>載入中...</div>}
            {!loading && !weather && <div className={cl("status")}>無法取得天氣</div>}
            {weather && (
                <>
                    <div className={cl("temp")}>{Math.round(weather.temperature)}°</div>
                    <div className={cl("desc")}>{describeCode(weather.weatherCode)}</div>
                </>
            )}
        </div>
    );
}
