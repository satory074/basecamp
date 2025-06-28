"use client";

import { useMagneticButton } from "../hooks/useMagneticButton";
import { useRipple } from "../hooks/useRipple";

interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary";
}

export default function MagneticButton({ 
    children, 
    className = "", 
    onClick,
    variant = "primary" 
}: MagneticButtonProps) {
    const magneticRef = useMagneticButton();
    const { ref: rippleRef, createRipple } = useRipple();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        createRipple(e);
        onClick?.();
    };

    const baseClasses = variant === "primary" 
        ? "btn-primary" 
        : "btn-secondary";

    return (
        <button
            ref={(el) => {
                if (el) {
                    (magneticRef as any).current = el;
                    (rippleRef as any).current = el;
                }
            }}
            className={`${baseClasses} ${className} magnetic-button relative overflow-hidden`}
            onClick={handleClick}
        >
            {children}
        </button>
    );
}