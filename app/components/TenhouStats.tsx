"use client";

import { useEffect, useState } from "react";
import TenhouIcon from "@/app/components/icons/TenhouIcon";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import type { TenhouStats as TenhouStatsData } from "@/app/lib/tenhou-types";

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
                console.log("Fetched Tenhou data:", data);
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) return <LoadingSkeleton rows={1} />;
    if (error) return <div className="text-red-500">エラー: {error}</div>;
    if (!stats) return <div className="text-gray-500">統計情報が取得できません</div>;

    return (
        <div className="space-y-6">
            {/* プレイヤー情報 - ゲームカード風デザイン */}
            <div className="relative overflow-hidden bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm border border-green-500/30 p-6 shadow-xl">
                {/* 背景の装飾 */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 blur-3xl transform translate-x-32 -translate-y-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500 blur-3xl transform -translate-x-24 translate-y-24"></div>
                </div>

                <div className="relative flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 blur-xl animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-3">
                                <TenhouIcon className="w-10 h-10 text-white" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.username}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                天鳳オンライン麻雀
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2">
                            <div className="text-3xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                                {stats.rank}
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {stats.rating - 1500}pt
                        </div>
                    </div>
                </div>

                {/* 対戦数バッジ */}
                <div className="absolute top-4 right-4 bg-green-500/20 backdrop-blur-sm px-3 py-1">
                    <span className="text-xs font-medium text-green-300">{stats.games} 戦</span>
                </div>
            </div>

            {/* 直近戦績ミニグラフ */}
            {stats.recentMatches && stats.recentMatches.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">直近戦績推移</h4>
                    <div className="relative h-12">
                        <svg className="w-full h-full" viewBox="0 0 200 48">
                            {/* 順位を反転（1位=高い、4位=低い）してプロット */}
                            {stats.recentMatches.slice(-10).map((match, index, arr) => {
                                const x = (index / (arr.length - 1)) * 180 + 10;
                                const y = ((5 - match.position) / 4) * 36 + 6; // 1位=42, 4位=6
                                const nextMatch = arr[index + 1];

                                return (
                                    <g key={index}>
                                        {/* 線グラフ */}
                                        {nextMatch && (
                                            <line
                                                x1={x}
                                                y1={y}
                                                x2={(index + 1) / (arr.length - 1) * 180 + 10}
                                                y2={((5 - nextMatch.position) / 4) * 36 + 6}
                                                stroke="#10b981"
                                                strokeWidth="2"
                                            />
                                        )}
                                        {/* データポイント */}
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="3"
                                            fill={match.position === 1 ? "#ffd700" : match.position === 2 ? "#c0c0c0" : match.position === 3 ? "#cd7f32" : "#6b7280"}
                                            className="drop-shadow-sm"
                                        />
                                    </g>
                                );
                            })}
                            {/* Y軸ラベル */}
                            <text x="4" y="10" fontSize="8" fill="#9ca3af">1位</text>
                            <text x="4" y="46" fontSize="8" fill="#9ca3af">4位</text>
                        </svg>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>過去10戦</span>
                        <span>
                            {stats.streaks?.currentStreak && (
                                <>現在: {stats.streaks.currentStreak}</>
                            )}
                        </span>
                    </div>
                </div>
            )}

            {/* 直近10戦の成績 */}
            <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">直近10戦</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {stats.recentMatches ? stats.recentMatches.length : "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">対戦数</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {stats.averageRank ? stats.averageRank.toFixed(2) : "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">平均順位</div>
                    </div>
                </div>
                {/* 連勝・連敗情報 */}
                {stats.streaks && (
                    <div className="mt-3 pt-3 border-t border-green-500/20">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                                最高連勝: {stats.streaks.maxWinStreak}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                                最高トップ: {stats.streaks.currentTopStreak}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* 基本統計 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 p-4 text-center hover:bg-white/10 transition-colors">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.games}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">対戦数</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 p-4 text-center hover:bg-white/10 transition-colors">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.totalPoints ? (stats.totalPoints > 0 ? "+" : "") + stats.totalPoints.toFixed(1) : "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">総得点</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 p-4 text-center hover:bg-white/10 transition-colors">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.averagePoints ? (stats.averagePoints > 0 ? "+" : "") + stats.averagePoints.toFixed(2) : "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">平均得点</p>
                </div>
            </div>

            {/* 順位分布 - ドーナツチャート */}
            <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    順位分布
                </h4>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* ドーナツチャート */}
                    <div className="relative w-48 h-48">
                        <svg className="w-full h-full transform -rotate-90">
                            {(() => {
                                const placements = [
                                    { label: "1位", value: stats.placements.first, color: "#fbbf24" },
                                    { label: "2位", value: stats.placements.second, color: "#9ca3af" },
                                    { label: "3位", value: stats.placements.third, color: "#f97316" },
                                    { label: "4位", value: stats.placements.fourth, color: "#ef4444" },
                                ];
                                let cumulativePercentage = 0;

                                return placements.map((placement, index) => {
                                    const startAngle = cumulativePercentage * 3.6;
                                    const endAngle = (cumulativePercentage + placement.value) * 3.6;
                                    cumulativePercentage += placement.value;

                                    const largeArcFlag = placement.value > 50 ? 1 : 0;
                                    const x1 = 96 + 60 * Math.cos((startAngle * Math.PI) / 180);
                                    const y1 = 96 + 60 * Math.sin((startAngle * Math.PI) / 180);
                                    const x2 = 96 + 60 * Math.cos((endAngle * Math.PI) / 180);
                                    const y2 = 96 + 60 * Math.sin((endAngle * Math.PI) / 180);

                                    return (
                                        <path
                                            key={index}
                                            d={`M 96 96 L ${x1} ${y1} A 60 60 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                            fill={placement.color}
                                            className="hover:opacity-80 transition-opacity duration-200"
                                            stroke="rgba(0,0,0,0.1)"
                                            strokeWidth="1"
                                        />
                                    );
                                });
                            })()}
                            {/* 中央の穴 */}
                            <circle cx="96" cy="96" r="35" className="fill-gray-900" />
                        </svg>
                        {/* 中央の平均順位 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-500">
                                    {calculateAveragePlace(stats.placements).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">平均順位</p>
                            </div>
                        </div>
                    </div>

                    {/* 凡例 */}
                    <div className="space-y-2">
                        {[
                            { label: "1位", value: stats.placements.first, color: "bg-yellow-400" },
                            { label: "2位", value: stats.placements.second, color: "bg-gray-400" },
                            { label: "3位", value: stats.placements.third, color: "bg-orange-500" },
                            { label: "4位", value: stats.placements.fourth, color: "bg-red-500" },
                        ].map((placement, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className={`w-4 h-4 ${placement.color}`}></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {placement.label}
                                </span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white ml-auto">
                                    {placement.value.toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 連続記録 */}
            {stats.streaks && (stats.streaks.currentTopStreak > 0 || stats.streaks.currentLastStreak > 0) && (
                <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        連続記録
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        {stats.streaks.currentTopStreak > 0 && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 text-center">
                                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {stats.streaks.currentTopStreak}連続
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">トップ継続中</p>
                            </div>
                        )}
                        {stats.streaks.currentLastStreak > 0 && (
                            <div className="bg-red-500/10 border border-red-500/30 p-4 text-center">
                                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                                    {stats.streaks.currentLastStreak}連続
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">ラス継続中</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 直近の対戦履歴 */}
            {stats.recentMatches && stats.recentMatches.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        直近の対戦履歴
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left py-2 px-2">日時</th>
                                    <th className="text-center py-2 px-2">ルーム</th>
                                    <th className="text-center py-2 px-2">順位</th>
                                    <th className="text-right py-2 px-2">得点</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentMatches.slice(0, 10).map((match, index) => (
                                    <tr key={index} className="border-b border-gray-800 hover:bg-white/5">
                                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                                            {new Date(match.date).toLocaleDateString("ja-JP", {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <span className="text-xs bg-gray-700 px-2 py-1">
                                                {match.roomType}
                                            </span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            <span className={`font-bold ${
                                                match.position === 1 ? "text-yellow-400" :
                                                match.position === 2 ? "text-gray-400" :
                                                match.position === 3 ? "text-orange-500" :
                                                "text-red-500"
                                            }`}>
                                                {match.position}位
                                            </span>
                                        </td>
                                        <td className={`py-2 px-2 text-right font-mono ${
                                            match.score >= 0 ? "text-green-500" : "text-red-500"
                                        }`}>
                                            {match.score > 0 ? "+" : ""}{match.score.toFixed(1)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* データソースと更新時刻 */}
            <div className="bg-white/5 backdrop-blur-sm border border-green-500/20 p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
                    <p>
                        最終更新: {new Date(stats.lastUpdated).toLocaleString("ja-JP")}
                    </p>
                    <p>
                        データソース: {
                            stats.dataSource === 'nodocchi-api' ? 'nodocchi.moe API' :
                            stats.dataSource === 'cache' ? 'キャッシュ' :
                            stats.dataSource === 'fallback' ? 'フォールバック' :
                            '不明'
                        }
                    </p>
                </div>
            </div>
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
