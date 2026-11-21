import Image from "next/image";
import type { HomeStats } from "@/app/lib/home-feed";
import CollapsibleBio from "./CollapsibleBio";
import ProfileLinkList from "@/app/components/site/ProfileLinkList";
import { config } from "@/app/lib/config";

interface HomeIntroProps {
    stats: HomeStats;
    bio: string;
}

/**
 * ホームの冒頭。以前はサイドバーに全ページ共通で出していたプロフィールを、ここにだけ置く。
 * 統計は英語ラベル (Articles / Books / Repos / Streak) をやめて日本語の <dl> にした。
 */
export default function HomeIntro({ stats, bio }: HomeIntroProps) {
    const items = [
        { label: "記事", value: stats.articles, unit: "本" },
        { label: "本棚", value: stats.books, unit: "冊" },
        { label: "リポジトリ", value: stats.repos, unit: "" },
        { label: "Duolingo 連続", value: stats.streak, unit: "日" },
    ].filter((s) => s.value > 0);

    return (
        <section className="intro" aria-labelledby="intro-name">
            <div className="intro-head">
                <Image
                    src={config.avatarUrl}
                    alt=""
                    width={72}
                    height={72}
                    className="intro-avatar"
                    priority
                />
                <div>
                    <h1 id="intro-name" className="intro-name">{config.siteName}</h1>
                    <p className="intro-role">{config.role}（{config.location}）</p>
                </div>
            </div>

            {/* 固定の自己紹介。meta description と JSON-LD の Person.description も同じ文 (config.ts) */}
            <p className="intro-summary">{config.profileSummary}</p>

            {bio && <CollapsibleBio bio={bio} />}

            {items.length > 0 && (
                <dl className="intro-stats">
                    {items.map((s) => (
                        <div key={s.label} className="intro-stat">
                            <dt>{s.label}</dt>
                            <dd>
                                {s.value.toLocaleString("ja-JP")}
                                {s.unit && <span className="intro-stat-unit">{s.unit}</span>}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}

            <ProfileLinkList />
        </section>
    );
}
