"use client";

import { 
    HomeIcon, 
    NewspaperIcon, 
    ChatBubbleLeftRightIcon,
    CodeBracketIcon,
    MusicalNoteIcon,
    BookOpenIcon,
    Bars3Icon,
    XMarkIcon,
    MoonIcon,
    SunIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState, useEffect } from "react";

const navLinks = [
    { href: "/", label: "ホーム", icon: HomeIcon },
    { href: "/hatena", label: "Hatena", icon: NewspaperIcon },
    { href: "/zenn", label: "Zenn", icon: ChatBubbleLeftRightIcon },
    { href: "/github", label: "GitHub", icon: CodeBracketIcon },
    { href: "/soundcloud", label: "SoundCloud", icon: MusicalNoteIcon },
    { href: "/booklog", label: "読書記録", icon: BookOpenIcon },
    { href: "/tenhou", label: "天鳳", icon: () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
            <circle cx="8" cy="9" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="16" cy="15" r="1.5" fill="currentColor"/>
            <path d="M8 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    )},
    { href: "/ff14", label: "FF14", icon: () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.5 7L20 7.5L16 11.5L17 17L12 14.5L7 17L8 11.5L4 7.5L9.5 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="12" cy="20" r="1.5" fill="currentColor"/>
            <path d="M6 19L18 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    )},
];

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check for saved theme preference or default to light
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        
        setIsDarkMode(shouldBeDark);
        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        }

        // Handle scroll
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setIsScrolled(scrollY > 10);
            
            // Calculate scroll progress for smooth transition
            const maxScroll = 100;
            const progress = Math.min(scrollY / maxScroll, 1);
            setScrollProgress(progress);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <header 
            className="fixed top-0 left-0 right-0 z-40 transition-all duration-700"
            style={{
                backgroundColor: isScrolled 
                    ? `rgba(255, 255, 255, ${0.1 + scrollProgress * 0.3})` 
                    : "transparent",
                backdropFilter: isScrolled ? `blur(${20 * scrollProgress}px)` : "none",
                WebkitBackdropFilter: isScrolled ? `blur(${20 * scrollProgress}px)` : "none",
                borderBottom: isScrolled ? `1px solid rgba(255, 255, 255, ${0.1 * scrollProgress})` : "none",
                boxShadow: isScrolled ? `0 8px 32px 0 rgba(31, 38, 135, ${0.15 * scrollProgress})` : "none",
            }}
        >
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link 
                        href="/" 
                        className="flex items-center space-x-2 group"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                            <span className="text-white font-bold text-xl">B</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Basecamp
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="nav-link flex items-center space-x-2 group"
                                >
                                    <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                            aria-label="Toggle dark mode"
                        >
                            {isDarkMode ? (
                                <SunIcon className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <MoonIcon className="w-5 h-5 text-gray-600" />
                            )}
                        </button>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? (
                                <XMarkIcon className="w-6 h-6" />
                            ) : (
                                <Bars3Icon className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div 
                    className={`md:hidden transition-all duration-300 ease-in-out ${
                        isMobileMenuOpen 
                            ? "max-h-96 opacity-100 py-4" 
                            : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                >
                    <nav className="flex flex-col space-y-2">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </header>
    );
}