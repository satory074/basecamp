"use client";

import Search from './Search';

export default function Header() {
    return (
        <header className="bg-white dark:bg-gray-800 py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Basecamp</h1>
                <Search />
            </div>
        </header>
    );
}
