'use client';

import { useState, useEffect } from 'react';
import TenhouIcon from "@/app/components/icons/TenhouIcon";
import BaseWidget from "./BaseWidget";
import { config } from "@/app/lib/config";
import type { TenhouStats } from "@/app/lib/tenhou-types";

export default function TenhouWidget() {
    const [stats, setStats] = useState<TenhouStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    const fetchStats = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/tenhou');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching Tenhou stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatRating = (rating: number, rank: string) => {
        // 段位の基準レーティングを計算
        const rankBases: { [key: string]: number } = {
            '初段': 1400,
            '二段': 1500,
            '三段': 1600,
            '四段': 1700,
            '五段': 1800,
            '六段': 1900,
            '七段': 2000,
            '八段': 2100,
            '九段': 2200,
            '特上': 2300,
            '天鳳': 2400,
        };

        const baseRating = rankBases[rank] || 1500;
        const points = rating - baseRating;

        return `${rank}${points >= 0 ? points : ''}pt`;
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-sm text-gray-600">読み込み中...</div>;
        }

        if (!stats) {
            return <div className="text-sm text-gray-600">データを取得できませんでした</div>;
        }

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-semibold">{formatRating(stats.rating, stats.rank)}</div>
                        <div className="text-sm text-gray-600">対戦数: {stats.games}戦</div>
                    </div>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        {showDetails ? '詳細を隠す' : '詳細を見る'}
                    </button>
                </div>

                {showDetails && (
                    <div className="pt-2 border-t space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-600">1位率:</span> {stats.placements.first.toFixed(1)}%
                            </div>
                            <div>
                                <span className="text-gray-600">2位率:</span> {stats.placements.second.toFixed(1)}%
                            </div>
                            <div>
                                <span className="text-gray-600">3位率:</span> {stats.placements.third.toFixed(1)}%
                            </div>
                            <div>
                                <span className="text-gray-600">4位率:</span> {stats.placements.fourth.toFixed(1)}%
                            </div>
                        </div>

                        {stats.averageRank && (
                            <div className="text-sm">
                                <span className="text-gray-600">平均順位:</span> {stats.averageRank.toFixed(3)}位
                            </div>
                        )}

                        {stats.averagePoints !== undefined && (
                            <div className="text-sm">
                                <span className="text-gray-600">平均得点:</span> {stats.averagePoints > 0 ? '+' : ''}{stats.averagePoints.toFixed(2)}
                            </div>
                        )}

                        {stats.totalPoints !== undefined && (
                            <div className="text-sm">
                                <span className="text-gray-600">通算得点:</span> {stats.totalPoints > 0 ? '+' : ''}{stats.totalPoints}
                            </div>
                        )}

                        <div className="text-xs text-gray-500">
                            最終更新: {new Date(stats.lastUpdated).toLocaleDateString('ja-JP')}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <BaseWidget
            title="天鳳"
            icon={<TenhouIcon />}
            link={config.profiles.tenhou.url}
            username={config.profiles.tenhou.username}
            colorScheme="green"
        >
            {renderContent()}
        </BaseWidget>
    );
}
