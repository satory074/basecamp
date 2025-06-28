export default function TenhouIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* 麻雀牌をモチーフにしたアイコン */}
            <rect
                x="3"
                y="4"
                width="18"
                height="16"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
            />
            <circle
                cx="8"
                cy="9"
                r="1.5"
                fill="currentColor"
            />
            <circle
                cx="12"
                cy="12"
                r="1.5"
                fill="currentColor"
            />
            <circle
                cx="16"
                cy="15"
                r="1.5"
                fill="currentColor"
            />
            <path
                d="M8 15L16 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}