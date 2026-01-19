"use client";

import { useEffect, useState } from "react";
import DeckList from "../components/DeckList";
import type { DeckData } from "../lib/types";

export default function DecksClient() {
    const [deckData, setDeckData] = useState<DeckData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/data/decks.json")
            .then((res) => res.json())
            .then((data) => {
                setDeckData(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="py-12 text-center text-gray-500">
                読み込み中...
            </div>
        );
    }

    if (!deckData) {
        return (
            <div className="py-12 text-center text-gray-500">
                デッキが見つかりませんでした
            </div>
        );
    }

    return <DeckList categories={deckData.categories} />;
}
