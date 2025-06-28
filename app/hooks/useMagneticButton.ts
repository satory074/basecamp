"use client";

import { useEffect, useRef } from "react";

export function useMagneticButton() {
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const button = ref.current;
        if (!button) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const distance = Math.sqrt(x * x + y * y);
            const maxDistance = Math.max(rect.width, rect.height);
            
            if (distance < maxDistance) {
                const strength = (maxDistance - distance) / maxDistance;
                const moveX = x * strength * 0.2;
                const moveY = y * strength * 0.2;
                
                button.style.transform = `translate(${moveX}px, ${moveY}px)`;
            }
        };

        const handleMouseLeave = () => {
            button.style.transform = "";
        };

        button.addEventListener("mousemove", handleMouseMove);
        button.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            button.removeEventListener("mousemove", handleMouseMove);
            button.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    return ref;
}