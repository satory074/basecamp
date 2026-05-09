"use client";

import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    value?: string;
}

export default function SearchBar({ onSearch, placeholder = "コンテンツを検索...", value }: SearchBarProps) {
    const [internal, setInternal] = useState("");
    const isControlled = value !== undefined;
    const current = isControlled ? value : internal;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(current);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        if (!isControlled) setInternal(next);
        onSearch(next);
    };

    return (
        <form onSubmit={handleSubmit} className="feed-search-row">
            <div className="feed-search-wrapper">
                <MagnifyingGlassIcon className="feed-search-icon" aria-hidden="true" />
                <input
                    type="search"
                    value={current}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="feed-search-input"
                    aria-label="検索"
                />
            </div>
        </form>
    );
}
