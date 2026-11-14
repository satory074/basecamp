import type { CSSProperties } from "react";
import { platformLabel, platformVar } from "@/app/lib/platforms";

/**
 * B 案: その日の記録をプラットフォーム別の件数比で 1 本の帯にする。
 * 帯そのものは色だけで情報を持つので aria-hidden にし、同じ内容を凡例の文字で必ず出す。
 */
export default function ActivityBand({ posts }: { posts: { platform: string }[] }) {
    const counts = new Map<string, number>();
    for (const p of posts) counts.set(p.platform, (counts.get(p.platform) ?? 0) + 1);
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return null;

    return (
        <div className="band">
            <div className="band-bar" aria-hidden="true">
                {entries.map(([platform, count]) => (
                    <span
                        key={platform}
                        className="band-seg"
                        style={{ flexGrow: count, "--platform": platformVar(platform) } as CSSProperties}
                    />
                ))}
            </div>
            <ul className="band-legend" role="list">
                {entries.map(([platform, count]) => (
                    <li key={platform} style={{ "--platform": platformVar(platform) } as CSSProperties}>
                        {platformLabel(platform, true)}
                        <span className="band-count">{count}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
