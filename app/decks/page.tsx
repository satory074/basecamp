"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import DeckList from "../components/DeckList";
import type { DeckData } from "../lib/types";

export default function DecksPage() {
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

    return (
        <div className="split-layout">
            <Sidebar activePlatform="decks" />

            <main className="main-content">
                <div className="content-wrapper">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Decks
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            使用中のツール・サービス
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="py-12 text-center text-gray-500">
                            Loading...
                        </div>
                    ) : deckData ? (
                        <DeckList categories={deckData.categories} />
                    ) : (
                        <div className="py-12 text-center text-gray-500">
                            No decks found.
                        </div>
                    )}

                    <div className="footer hide-desktop">
                        <p>© 2025 satory074</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
