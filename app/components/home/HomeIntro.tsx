import Image from "next/image";
import type { HomeStats } from "@/app/lib/home-feed";
import CollapsibleBio from "./CollapsibleBio";
import ProfileLinkList from "@/app/components/site/ProfileLinkList";

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
                    src="https://github.com/satory074.png"
                    alt=""
                    width={72}
                    height={72}
                    className="intro-avatar"
                    priority
                />
                <div>
                    <h1 id="intro-name" className="intro-name">satory074</h1>
                    <p className="intro-role">Creative Developer（Tokyo, JP）</p>
                </div>
            </div>

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
