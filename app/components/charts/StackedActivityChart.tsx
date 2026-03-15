export interface PlatformHourDatum {
    hour: number;       // bucket index (0 = oldest)
    label: string;      // e.g. "13:00"
    segments: { platform: string; count: number; color: string }[];
    total: number;
}

interface StackedActivityChartProps {
    data: PlatformHourDatum[];
    title?: string;
}

export default function StackedActivityChart({ data, title }: StackedActivityChartProps) {
    if (data.length === 0) return null;

    const width = 400;
    const height = 100;
    const paddingLeft = 8;
    const paddingRight = 28;
    const paddingTop = 8;
    const paddingBottom = 24;
    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    const n = data.length;
    const barW = (chartW / n) * 0.75;
    const barSpacing = chartW / n;

    const maxVal = Math.max(...data.map((d) => d.total), 1);

    // Collect active platforms for legend
    const platformSet = new Map<string, string>(); // platform → color
    for (const d of data) {
        for (const seg of d.segments) {
            if (!platformSet.has(seg.platform)) {
                platformSet.set(seg.platform, seg.color);
            }
        }
    }

    // X-axis tick positions: every 24 buckets (for 72h: at 0, 24, 48, 72)
    const tickInterval = 24;
    const xTicks: { x: number; label: string }[] = [];
    for (let i = 0; i <= n; i += tickInterval) {
        const bucketIdx = Math.min(i, n - 1);
        const x = paddingLeft + (i / n) * chartW;
        const hoursAgo = n - i;
        const label = hoursAgo === 0 ? "今" : hoursAgo === n ? `${n}h前` : `${hoursAgo}h前`;
        xTicks.push({ x, label });
    }

    // Platform short display names
    const platformShortNames: Record<string, string> = {
        hatena: "Hatena",
        zenn: "Zenn",
        github: "GitHub",
        booklog: "Booklog",
        note: "Note",
        filmarks: "Filmarks",
        spotify: "Spotify",
        hatenabookmark: "HatenaBM",
        "ff14-achievement": "FF14",
        tenhou: "天鳳",
        x: "X",
        duolingo: "Duolingo",
        steam: "Steam",
    };

    return (
        <div style={{ marginBottom: "0.75rem" }}>
            {title && <div className="chart-section-title">{title}</div>}
            <div className="chart-container chart-bar" style={{ overflowX: "auto" }}>
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    width="100%"
                    style={{ display: "block", minWidth: 200 }}
                    aria-label={title ?? "アクティビティグラフ"}
                >
                    {/* Stacked bars */}
                    {data.map((d, i) => {
                        if (d.total === 0) return null;
                        const barX = paddingLeft + i * barSpacing + (barSpacing - barW) / 2;
                        let yOffset = paddingTop + chartH;
                        return (
                            <g key={i}>
                                {d.segments.map((seg) => {
                                    const segH = (seg.count / maxVal) * chartH;
                                    yOffset -= segH;
                                    return (
                                        <rect
                                            key={seg.platform}
                                            x={barX}
                                            y={yOffset}
                                            width={barW}
                                            height={segH}
                                            fill={seg.color}
                                            opacity="0.85"
                                        />
                                    );
                                })}
                            </g>
                        );
                    })}

                    {/* X axis line */}
                    <line
                        x1={paddingLeft}
                        y1={paddingTop + chartH}
                        x2={paddingLeft + chartW}
                        y2={paddingTop + chartH}
                        stroke="var(--color-text-secondary)"
                        strokeWidth="0.5"
                        opacity="0.4"
                    />

                    {/* X axis labels */}
                    {xTicks.map(({ x, label }) => (
                        <text
                            key={label}
                            x={x}
                            y={paddingTop + chartH + 14}
                            fontSize="8"
                            fill="var(--color-text-secondary)"
                            textAnchor="middle"
                        >
                            {label}
                        </text>
                    ))}

                    {/* Y axis max label */}
                    <text
                        x={paddingLeft + chartW + 4}
                        y={paddingTop + 4}
                        fontSize="8"
                        fill="var(--color-text-secondary)"
                        dominantBaseline="middle"
                    >
                        {maxVal}
                    </text>
                </svg>

                {/* Legend */}
                {platformSet.size > 0 && (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.25rem 0.75rem",
                            marginTop: "0.25rem",
                            fontSize: "0.65rem",
                            color: "var(--color-text-secondary)",
                        }}
                    >
                        {Array.from(platformSet.entries()).map(([platform, color]) => (
                            <span key={platform} style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "2px",
                                        background: color,
                                        flexShrink: 0,
                                    }}
                                />
                                {platformShortNames[platform] ?? platform}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
