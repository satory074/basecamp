"use client";

import type { DeckCategory, DeckItem } from "../lib/types";

interface DeckListProps {
    categories: DeckCategory[];
}

function DeckIcon({ icon, name }: { icon: string; name: string }) {
    return (
        <div className="deck-item-icon">
            <img
                src={`/icons/${icon}.svg`}
                alt={name}
                onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) {
                        fallback.style.display = "flex";
                    }
                }}
            />
            <span
                style={{ display: "none" }}
                className="w-5 h-5 items-center justify-center text-xs font-medium text-gray-500 bg-gray-100 rounded"
            >
                {name.charAt(0).toUpperCase()}
            </span>
        </div>
    );
}

export default function DeckList({ categories }: DeckListProps) {
    const allItems: { item: DeckItem; category: DeckCategory }[] = [];

    categories.forEach((category) => {
        category.items.forEach((item) => {
            allItems.push({ item, category });
        });
    });

    return (
        <div>
            {allItems.map(({ item, category }, index) => (
                <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="deck-item"
                >
                    <span className="deck-item-number">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                    <DeckIcon icon={item.icon} name={item.name} />
                    <span className="deck-item-name">{item.name}</span>
                    <span className="deck-item-category hide-mobile">
                        {category.name}
                    </span>
                    <span className="deck-item-arrow">→</span>
                </a>
            ))}
        </div>
    );
}
