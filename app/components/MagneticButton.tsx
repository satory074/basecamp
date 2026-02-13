"use client";

import type { Ref } from "react";
import { useMagneticButton } from "../hooks/useMagneticButton";
import { useRipple } from "../hooks/useRipple";

interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: "primary" | "secondary";
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
    return (value: T | null) => {
        refs.forEach((ref) => {
            if (!ref) return;
            if (typeof ref === "function") {
                ref(value);
                return;
            }
            ref.current = value;
        });
    };
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
            ref={mergeRefs<HTMLButtonElement>(magneticRef, rippleRef)}
            className={`${baseClasses} ${className} magnetic-button relative overflow-hidden`}
            onClick={handleClick}
        >
            {children}
        </button>
    );
}
