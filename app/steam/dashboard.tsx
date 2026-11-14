/** steam ページ上部の統計。ビルド時にサーバーで計算する (以前はブラウザで JSON を読んでから出していた) */
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import { BarChart } from "../components/charts";
import type { Post } from "../lib/types";

export function renderSteamDashboard(posts: Post[]) {
    if (posts.length === 0) return null;
    const gameNames = posts
        .map((p) => p.data?.gameName)
        .filter((g): g is string => typeof g === "string" && g.length > 0);
    const games = new Set(gameNames).size;

    // Achievements per game top 10
    const gameCounts = gameNames.reduce<Record<string, number>>((acc, g) => {
        acc[g] = (acc[g] ?? 0) + 1;
        return acc;
    }, {});
    const gameData = Object.entries(gameCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, value]) => ({ label, value }));

    return (
        <>
            <PlatformDashboard
                platform="steam"
                stats={[
                    { label: "総実績数", value: posts.length },
                    { label: "ゲーム数", value: games },
                ]}
            />
            {gameData.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                    <BarChart
                        data={gameData}
                        platformColor="var(--color-steam)"
                        horizontal
                        title="ゲーム別実績数 Top10"
                    />
                </div>
            )}
        </>
    );
}

