"use client";

import { useEffect, useState } from "react";
import TenhouIcon from "@/app/components/icons/TenhouIcon";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

interface TenhouStatsData {
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
    lastUpdated: string;
}

export default function TenhouStats() {
    const [stats, setStats] = useState<TenhouStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch("/api/tenhou");
                if (!response.ok) {
                    throw new Error("Failed to fetch Tenhou stats");
                }
                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) return <LoadingSkeleton count={1} />;
    if (error) return <div className="text-red-500">エラー: {error}</div>;
    if (!stats) return <div className="text-gray-500">統計情報が取得できません</div>;

    return (
        <div className="space-y-6">
            {/* プレイヤー情報 */}
            <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <TenhouIcon className="w-8 h-8 text-green-500" />
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {stats.username}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                天鳳プレイヤー
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.rank}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            R{stats.rating}
                        </p>
                    </div>
                </div>
            </div>

            {/* 基本統計 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.games}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">対戦数</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.winRate}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">和了率</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.dealInRate}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">放銃率</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.riichiRate}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">リーチ率</p>
                </div>
            </div>

            {/* 順位分布 */}
            <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    順位分布
                </h4>
                <div className="space-y-3">
                    {[
                        { label: "1位", value: stats.placements.first, color: "bg-yellow-500" },
                        { label: "2位", value: stats.placements.second, color: "bg-gray-400" },
                        { label: "3位", value: stats.placements.third, color: "bg-orange-600" },
                        { label: "4位", value: stats.placements.fourth, color: "bg-red-500" },
                    ].map((placement, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <span className="w-8 text-sm font-medium text-gray-600 dark:text-gray-400">
                                {placement.label}
                            </span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                                <div
                                    className={`${placement.color} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                                    style={{ width: `${placement.value}%` }}
                                >
                                    <span className="text-xs font-medium text-white">
                                        {placement.value}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* その他の統計 */}
            <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    プレイスタイル
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">副露率</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            {stats.callRate}%
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">平均順位</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            {calculateAveragePlace(stats.placements).toFixed(2)}位
                        </p>
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                最終更新: {new Date(stats.lastUpdated).toLocaleString("ja-JP")}
            </p>
        </div>
    );
}

function calculateAveragePlace(placements: { first: number; second: number; third: number; fourth: number }): number {
    const total = placements.first + placements.second + placements.third + placements.fourth;
    if (total === 0) return 2.5;
    
    return (
        (placements.first * 1 + placements.second * 2 + placements.third * 3 + placements.fourth * 4) / total
    );
}