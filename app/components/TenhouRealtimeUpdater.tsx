"use client";

import { useState } from "react";

interface TenhouStats {
    username: string;
    rank: string;
    rating: number;
    games: number;
    placements: {
        first: number;
        second: number;
        third: number;
        fourth: number;
    };
    winRate: number;
    dealInRate: number;
    riichiRate: number;
    callRate: number;
    totalPoints?: number;
    averagePoints?: number;
    averageRank?: number;
    lastUpdated: string;
}

interface TenhouRealtimeUpdaterProps {
    onUpdate: (data: TenhouStats) => void;
}

export default function TenhouRealtimeUpdater({ onUpdate }: TenhouRealtimeUpdaterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [instructions, setInstructions] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedText = e.clipboardData.getData('text');
        if (!pastedText) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/tenhou/realtime', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ htmlContent: pastedText }),
            });
            
            if (!response.ok) {
                throw new Error('データの解析に失敗しました');
            }
            
            const result = await response.json();
            if (result.success && result.data) {
                onUpdate(result.data);
                setIsOpen(false);
                setInstructions(true);
            } else {
                throw new Error('データの形式が正しくありません');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
                リアルタイム更新
            </button>
            
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">天鳳データをリアルタイム取得</h3>
                        
                        {instructions && (
                            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">手順：</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm">
                                    <li>
                                        <a 
                                            href="https://nodocchi.moe/tenhoulog/?name=Unbobo" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 underline"
                                        >
                                            nodocchi.moeを開く
                                        </a>
                                    </li>
                                    <li>ページが完全に読み込まれるまで待つ（5-10秒）</li>
                                    <li>ページ全体を選択（Ctrl+A / Cmd+A）</li>
                                    <li>コピー（Ctrl+C / Cmd+C）</li>
                                    <li>下のテキストエリアに貼り付け（Ctrl+V / Cmd+V）</li>
                                </ol>
                                <button
                                    onClick={() => setInstructions(false)}
                                    className="mt-3 text-sm text-gray-600 dark:text-gray-400 underline"
                                >
                                    手順を隠す
                                </button>
                            </div>
                        )}
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                ページの内容を貼り付けてください：
                            </label>
                            <textarea
                                onPaste={handlePaste}
                                placeholder="ここに貼り付け..."
                                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                         focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                disabled={loading}
                            />
                        </div>
                        
                        {loading && (
                            <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">データを解析中...</p>
                            </div>
                        )}
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                                {error}
                            </div>
                        )}
                        
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setError(null);
                                    setInstructions(true);
                                }}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                disabled={loading}
                            >
                                キャンセル
                            </button>
                        </div>
                        
                        <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                            ※ データはサーバーで処理され、保存されません
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}