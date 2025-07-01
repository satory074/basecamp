"use client";

import { useEffect, useState } from "react";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import Image from "next/image";

interface FF14CharacterData {
    id: number;
    name: string;
    server: string;
    avatar: string;
    portrait: string;
    bio: string;
    race: string;
    tribe: string;
    gender: string;
    activeClassJob: {
        id: number;
        name: string;
        level: number;
        icon: string;
    };
    classJobs: Array<{
        id: number;
        name: string;
        level: number;
        expLevel: number;
        expLevelMax: number;
        expLevelTogo: number;
        isSpecialised: boolean;
        icon: string;
    }>;
    freeCompany?: {
        id: string;
        name: string;
        tag: string;
    };
    minions: number;
    mounts: number;
    achievementPoints: number;
    lastUpdated: string;
}

// ジョブのカテゴリ分け
const JOB_CATEGORIES = {
    tank: ["ナイト", "戦士", "暗黒騎士", "ガンブレイカー"],
    healer: ["白魔道士", "学者", "占星術師", "賢者"],
    melee: ["モンク", "竜騎士", "忍者", "侍", "リーパー", "ヴァイパー"],
    ranged: ["吟遊詩人", "機工士", "踊り子"],
    magic: ["黒魔道士", "召喚士", "赤魔道士", "ピクトマンサー"],
    crafter: ["木工師", "鍛冶師", "甲冑師", "彫金師", "革細工師", "裁縫師", "錬金術師", "調理師"],
    gatherer: ["採掘師", "園芸師", "漁師"],
};

export default function FF14Character({ compact = false }: { compact?: boolean }) {
    const [character, setCharacter] = useState<FF14CharacterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCharacter() {
            try {
                const response = await fetch("/api/ff14");
                if (!response.ok) {
                    throw new Error("Failed to fetch FF14 character");
                }
                const data = await response.json();
                setCharacter(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }
        fetchCharacter();
    }, []);

    if (loading) return <LoadingSkeleton count={1} />;
    if (error) return <div className="text-red-500">エラー: {error}</div>;
    if (!character) return <div className="text-gray-500">キャラクター情報が取得できません</div>;

    if (compact) {
        // コンパクト表示（メインページ用）
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Image
                        src={character.avatar}
                        alt={character.name}
                        width={60}
                        height={60}
                        className="rounded-full border-2 border-purple-500"
                        unoptimized
                    />
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                            {character.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {character.server} | Lv.{character.activeClassJob.level} {character.activeClassJob.name}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-purple-500/10 rounded-lg p-2">
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {character.achievementPoints}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">アチーブ</p>
                    </div>
                    <div className="bg-purple-500/10 rounded-lg p-2">
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {character.minions}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">ミニオン</p>
                    </div>
                    <div className="bg-purple-500/10 rounded-lg p-2">
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {character.mounts}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">マウント</p>
                    </div>
                </div>
            </div>
        );
    }

    // フル表示（専用ページ用）
    return (
        <div className="space-y-6">
            {/* キャラクター情報 */}
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                        <Image
                            src={character.portrait}
                            alt={character.name}
                            width={200}
                            height={300}
                            className="rounded-lg border-2 border-purple-500"
                            unoptimized
                        />
                    </div>
                    <div className="flex-grow space-y-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                {character.name}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                {character.server} | {character.race} {character.tribe} ({character.gender})
                            </p>
                            {character.freeCompany && (
                                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                                    &lt;{character.freeCompany.tag}&gt; {character.freeCompany.name}
                                </p>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Image
                                src={character.activeClassJob.icon}
                                alt={character.activeClassJob.name}
                                width={40}
                                height={40}
                                className="rounded"
                                unoptimized
                            />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {character.activeClassJob.name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Lv. {character.activeClassJob.level}
                                </p>
                            </div>
                        </div>

                        {character.bio && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                &quot;{character.bio}&quot;
                            </p>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {character.achievementPoints}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    アチーブメント
                                </p>
                            </div>
                            <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {character.minions}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    ミニオン
                                </p>
                            </div>
                            <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {character.mounts}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    マウント
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ジョブレベル */}
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    ジョブレベル
                </h3>
                <div className="space-y-6">
                    {Object.entries(JOB_CATEGORIES).map(([category, jobNames]) => {
                        const jobs = character.classJobs.filter(job => 
                            jobNames.some(name => job.name.includes(name))
                        );
                        
                        if (jobs.length === 0) return null;
                        
                        return (
                            <div key={category}>
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase">
                                    {category === "tank" ? "タンク" :
                                     category === "healer" ? "ヒーラー" :
                                     category === "melee" ? "近接DPS" :
                                     category === "ranged" ? "遠隔物理DPS" :
                                     category === "magic" ? "遠隔魔法DPS" :
                                     category === "crafter" ? "クラフター" :
                                     "ギャザラー"}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {jobs.map((job) => (
                                        <div key={job.id} className="flex items-center gap-3">
                                            {job.icon && (
                                                <Image
                                                    src={job.icon}
                                                    alt={job.name}
                                                    width={32}
                                                    height={32}
                                                    className="rounded"
                                                    unoptimized
                                                />
                                            )}
                                            <div className="flex-grow">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {job.name}
                                                    </span>
                                                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                                        Lv. {job.level}
                                                    </span>
                                                </div>
                                                {job.level < 100 && job.level > 0 && (
                                                    <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                        <div
                                                            className="bg-purple-600 h-1.5 rounded-full"
                                                            style={{
                                                                width: `${(job.expLevel / job.expLevelMax) * 100}%`
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                最終更新: {new Date(character.lastUpdated).toLocaleString("ja-JP")}
            </p>
        </div>
    );
}