"use client";

import { useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface TenhouDataUpdaterProps {
    onUpdate: (data: any) => void;
}

export default function TenhouDataUpdater({ onUpdate }: TenhouDataUpdaterProps) {
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState("");

    const updateData = async () => {
        setUpdating(true);
        setMessage("データを更新中...");

        try {
            // APIからデータを再取得
            const response = await fetch("/api/tenhou", {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("データの取得に失敗しました");
            }

            const data = await response.json();
            onUpdate(data);
            setMessage("データを更新しました！");
            
            // 3秒後にメッセージをクリア
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            setMessage("更新に失敗しました");
            console.error("Update error:", error);
        } finally {
            setUpdating(false);
        }
    };

    const handleManualInput = () => {
        const instruction = `
nodocchi.moeから最新データを取得する方法：

1. https://nodocchi.moe/tenhoulog/?name=Unbobo を開く
2. ページが完全に読み込まれるのを待つ
3. 以下のデータをコピーしてください：
   - 段位とポイント
   - 対戦数
   - 順位分布（1位〜4位の回数）
   - 平均得点と平均順位
   - 総得点

データを入力フォームに貼り付けてください。
        `;
        
        const input = prompt(instruction);
        if (input) {
            // ここでデータを解析して更新
            try {
                // 簡易的なパース例
                const parsedData = parseManualInput(input);
                onUpdate(parsedData);
                setMessage("手動でデータを更新しました！");
            } catch (error) {
                setMessage("入力データの形式が正しくありません");
            }
        }
    };

    const parseManualInput = (input: string) => {
        // 手動入力のパース例
        // 実際の実装では、より詳細なパースロジックが必要
        return {
            username: "Unbobo",
            rank: "四段",
            rating: 1610,
            games: 294,
            placements: {
                first: 25.8,
                second: 24.8,
                third: 28.9,
                fourth: 20.4,
            },
            winRate: 24.2,
            dealInRate: 12.5,
            riichiRate: 19.8,
            callRate: 25.6,
            totalPoints: 423,
            averagePoints: 1.44,
            averageRank: 2.439,
            lastUpdated: new Date().toISOString(),
        };
    };

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={updateData}
                disabled={updating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
            >
                <ArrowPathIcon className={`w-4 h-4 ${updating ? "animate-spin" : ""}`} />
                {updating ? "更新中..." : "データ更新"}
            </button>
            
            <button
                onClick={handleManualInput}
                className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline"
            >
                手動で更新
            </button>
            
            {message && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {message}
                </span>
            )}
        </div>
    );
}