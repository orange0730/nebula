import { toggleFreeMode } from "../state";

export function EntryButton() {
    return (
        <div className="nebula-entry-button" onClick={toggleFreeMode} title="自由模式">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9" />
                <rect x="9" y="1" width="6" height="4" rx="1.5" fill="currentColor" opacity="0.55" />
                <rect x="9" y="7" width="6" height="8" rx="1.5" fill="currentColor" opacity="0.75" />
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4" />
            </svg>
        </div>
    );
}
