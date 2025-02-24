"use client";

import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="container mx-auto px-4">
                <div className="flex flex-wrap -mx-4">
                    {children}
                </div>
            </div>
            <Footer />
        </div>
    );
}
