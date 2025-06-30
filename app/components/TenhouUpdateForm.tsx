'use client';

import React, { useState } from 'react';

interface TenhouUpdateFormProps {
    onUpdate?: () => void;
}

export default function TenhouUpdateForm({ onUpdate }: TenhouUpdateFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        rank: '四段',
        rating: 1610,
        games: 294,
        first: 25.8,
        second: 24.8,
        third: 28.9,
        fourth: 20.4,
        winRate: 24.2,
        dealInRate: 12.5,
        riichiRate: 19.8,
        callRate: 25.6,
        totalPoints: 423,
        averagePoints: 1.44,
        averageRank: 2.439
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/tenhou/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rank: formData.rank,
                    rating: formData.rating,
                    games: formData.games,
                    placements: {
                        first: formData.first,
                        second: formData.second,
                        third: formData.third,
                        fourth: formData.fourth
                    },
                    winRate: formData.winRate,
                    dealInRate: formData.dealInRate,
                    riichiRate: formData.riichiRate,
                    callRate: formData.callRate,
                    totalPoints: formData.totalPoints,
                    averagePoints: formData.averagePoints,
                    averageRank: formData.averageRank
                })
            });

            if (response.ok) {
                alert('データを更新しました');
                setIsOpen(false);
                if (onUpdate) {
                    onUpdate();
                }
            } else {
                alert('更新に失敗しました');
            }
        } catch (error) {
            console.error('Error updating data:', error);
            alert('エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'rank' ? value : parseFloat(value) || 0
        }));
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
                手動でデータを更新
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">天鳳データの手動更新</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">段位</label>
                            <select
                                name="rank"
                                value={formData.rank}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            >
                                <option value="初段">初段</option>
                                <option value="二段">二段</option>
                                <option value="三段">三段</option>
                                <option value="四段">四段</option>
                                <option value="五段">五段</option>
                                <option value="六段">六段</option>
                                <option value="七段">七段</option>
                                <option value="八段">八段</option>
                                <option value="九段">九段</option>
                                <option value="特上">特上</option>
                                <option value="天鳳">天鳳</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">レーティング</label>
                            <input
                                type="number"
                                name="rating"
                                value={formData.rating}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">対戦数</label>
                        <input
                            type="number"
                            name="games"
                            value={formData.games}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-medium">順位分布 (%)</h3>
                        <div className="grid grid-cols-4 gap-2">
                            <div>
                                <label className="text-sm">1位</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="first"
                                    value={formData.first}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="text-sm">2位</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="second"
                                    value={formData.second}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="text-sm">3位</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="third"
                                    value={formData.third}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="text-sm">4位</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="fourth"
                                    value={formData.fourth}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">和了率 (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="winRate"
                                value={formData.winRate}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">放銃率 (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="dealInRate"
                                value={formData.dealInRate}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">立直率 (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="riichiRate"
                                value={formData.riichiRate}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">副露率 (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                name="callRate"
                                value={formData.callRate}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">通算得点</label>
                            <input
                                type="number"
                                name="totalPoints"
                                value={formData.totalPoints}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">平均得点</label>
                            <input
                                type="number"
                                step="0.01"
                                name="averagePoints"
                                value={formData.averagePoints}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">平均順位</label>
                            <input
                                type="number"
                                step="0.001"
                                name="averageRank"
                                value={formData.averageRank}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? '更新中...' : '更新'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}