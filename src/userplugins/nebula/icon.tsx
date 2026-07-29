import type { IconProps } from "@utils/types";

export function NebulaIcon({ height = 24, width = 24, className }: IconProps) {
    return (
        <svg
            className={className}
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
        >
            <path
                d="M12 1 L14.2 9.8 L23 12 L14.2 14.2 L12 23 L9.8 14.2 L1 12 L9.8 9.8 Z"
                fill="currentColor"
            />
            <circle cx="19" cy="5" r="1.6" fill="currentColor" opacity="0.6" />
        </svg>
    );
}
