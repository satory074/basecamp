export interface StatItem {
    label: string;
    value: string | number;
}

interface PlatformDashboardProps {
    /** 以前は左ボーダーの色に使っていた。今は使わない (呼び出し側の互換のため残す) */
    platform?: string;
    stats: StatItem[];
}

/**
 * ページ上部の数字の並び。<dl> にして「何の数字か」を読み上げで対応づける。
 * サーバーでビルド時に計算して描く (以前はブラウザで JSON を読んでから出していた)。
 */
export default function PlatformDashboard({ stats }: PlatformDashboardProps) {
    if (stats.length === 0) return null;
    return (
        <dl className="stats">
            {stats.map((stat) => (
                <div key={stat.label} className="stat">
                    <dt>{stat.label}</dt>
                    <dd>{typeof stat.value === "number" ? stat.value.toLocaleString("ja-JP") : stat.value}</dd>
                </div>
            ))}
        </dl>
    );
}
