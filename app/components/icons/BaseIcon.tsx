import { IconProps } from "./types";

export default function BaseIcon({
    children,
    className = "w-5 h-5",
    size, // Accept size prop
    ...props
}: IconProps & { children: React.ReactNode }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            width={size} // Use size for width
            height={size} // Use size for height
            {...props}
        >
            {children}
        </svg>
    );
}
