export default function FF14Icon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* FF14のメテオアイコン風デザイン */}
            <path
                d="M12 2L14.5 7L20 7.5L16 11.5L17 17L12 14.5L7 17L8 11.5L4 7.5L9.5 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <circle
                cx="12"
                cy="20"
                r="1.5"
                fill="currentColor"
            />
            <path
                d="M6 19L18 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}