"use client";

import { forwardRef, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    value?: string;
    onClear?: () => void;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
    { onSearch, placeholder = "コンテンツを検索...", value, onClear },
    ref,
) {
    const [internal, setInternal] = useState("");
    const isControlled = value !== undefined;
    const current = isControlled ? value : internal;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        if (!isControlled) setInternal(next);
        onSearch(next);
    };

    const handleClear = () => {
        if (!isControlled) setInternal("");
        onSearch("");
        onClear?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape" && current) {
            e.preventDefault();
            handleClear();
        }
    };

    return (
        <div className="feed-search-row">
            <div className="feed-search-wrapper">
                <MagnifyingGlassIcon className="feed-search-icon" aria-hidden="true" />
                <input
                    ref={ref}
                    type="search"
                    value={current}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="feed-search-input"
                    aria-label="検索"
                />
                {current && (
                    <button
                        type="button"
                        className="feed-search-clear"
                        onClick={handleClear}
                        aria-label="検索をクリア"
                    >
                        <XMarkIcon aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    );
});

export default SearchBar;
