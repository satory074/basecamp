"use client";

import { useEffect, useState, useRef } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import MagneticButton from "./MagneticButton";

export default function ParallaxHero() {
    const [scrollY, setScrollY] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [particles, setParticles] = useState<Array<{ left: number; top: number; delay: number; duration: number }>>([]);
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // パーティクルをクライアントサイドで生成
        setParticles(
            [...Array(20)].map(() => ({
                left: Math.random() * 100,
                top: Math.random() * 100,
                delay: Math.random() * 5,
                duration: 10 + Math.random() * 20,
            }))
        );

        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (heroRef.current) {
                const rect = heroRef.current.getBoundingClientRect();
                const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
                const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
                setMousePosition({ x, y });
            }
        };

        window.addEventListener("scroll", handleScroll);
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    // シンプルなテキストアニメーション
    const animateText = (text: string, delay: number = 0) => {
        return (
            <span
                className="inline-block opacity-0 animate-slideInUp"
                style={{
                    animationDelay: `${delay}ms`,
                    animationFillMode: "forwards",
                }}
            >
                {text}
            </span>
        );
    };

    return (
        <div ref={heroRef} className="relative mb-16 overflow-hidden min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh]">
            {/* パララックス背景レイヤー */}
            <div 
                className="absolute inset-0 bg-gradient-to-br from-indigo-50/95 via-white/90 to-purple-50/95 dark:from-gray-900/95 dark:via-slate-800/95 dark:to-gray-900/95 z-0"
                style={{
                    transform: `translateY(${scrollY * 0.5}px)`,
                }}
            />
            
            {/* コントラスト強化オーバーレイ */}
            <div className="absolute inset-0 bg-black/5 dark:bg-black/20 z-5" />
            
            {/* パララックスオーブ */}
            <div className="absolute inset-0 z-10">
                <div 
                    className="absolute top-10 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-indigo-500/15 sm:bg-indigo-500/20 rounded-full blur-3xl"
                    style={{
                        transform: `translate(${mousePosition.x * 50}px, ${mousePosition.y * 50 + scrollY * 0.3}px)`,
                        transition: "transform 0.3s ease-out",
                    }}
                />
                <div 
                    className="absolute bottom-10 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/15 sm:bg-purple-500/20 rounded-full blur-3xl"
                    style={{
                        transform: `translate(${-mousePosition.x * 30}px, ${-mousePosition.y * 30 + scrollY * 0.2}px)`,
                        transition: "transform 0.3s ease-out",
                    }}
                />
                <div 
                    className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"
                    style={{
                        transform: `translate(${-50 + mousePosition.x * 20}%, ${-50 + mousePosition.y * 20 + scrollY * 0.1}%)`,
                        transition: "transform 0.3s ease-out",
                    }}
                />
            </div>

            {/* フローティングパーティクル */}
            <div className="absolute inset-0 overflow-hidden">
                {particles.map((particle, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-indigo-500/30 rounded-full animate-floatParticle"
                        style={{
                            left: `${particle.left}%`,
                            top: `${particle.top}%`,
                            animationDelay: `${particle.delay}s`,
                            animationDuration: `${particle.duration}s`,
                        }}
                    />
                ))}
            </div>

            {/* コンテンツ */}
            <div className="relative px-4 py-16 sm:py-20 text-center flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] z-20">
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <SparklesIcon className="h-16 w-16 text-indigo-600 dark:text-indigo-400 animate-pulse-slow" />
                        <div className="absolute inset-0 h-16 w-16 bg-indigo-500/20 rounded-full blur-xl animate-pulse" style={{ willChange: 'transform' }}></div>
                    </div>
                </div>
                
                <h1 className="hero-text-responsive md:text-8xl font-black mb-6 leading-tight">
                    <span className="text-gradient drop-shadow-lg block">
                        {animateText("Welcome to", 200)}
                    </span>
                    <span className="text-gradient drop-shadow-lg block mt-2">
                        {animateText("Basecamp", 400)}
                    </span>
                </h1>
                
                <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium opacity-0 animate-fadeIn animation-delay-1000">
                    すべてのクリエイティブ活動を一つの場所で<br />
                    <span className="text-lg text-gray-500 dark:text-gray-400">All your creative activities in one place</span>
                </p>
                
                <div className="mt-10 opacity-0 animate-fadeIn animation-delay-1500">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <MagneticButton
                            onClick={() => {
                                document.querySelector('#main-content')?.scrollIntoView({ 
                                    behavior: 'smooth' 
                                });
                            }}
                            className="px-8 py-4 text-lg"
                            variant="primary"
                        >
                            <span className="relative z-10">探索を始める</span>
                        </MagneticButton>
                    </div>
                </div>
            </div>
        </div>
    );
}