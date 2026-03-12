export interface ActivityDatum {
    hour: number;   // JST時刻 0-23
    count: number;
    label: string;  // "13:00" など
}

interface ActivityChartProps {
    data: ActivityDatum[];
    title?: string;
}

export default function ActivityChart({ data, title }: ActivityChartProps) {
    if (data.length === 0) return null;

    const width = 400;
    const height = 80;
    const paddingLeft = 8;
    const paddingRight = 28;
    const paddingTop = 8;
    const paddingBottom = 20;
    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...data.map((d) => d.count), 1);

    // Build SVG path points
    const points = data.map((d, i) => {
        const x = paddingLeft + (i / (data.length - 1)) * chartW;
        const y = paddingTop + chartH - (d.count / maxVal) * chartH;
        return { x, y };
    });

    // Area path (closed polygon)
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const areaPath =
        `${linePath} L${points[points.length - 1].x.toFixed(1)},${(paddingTop + chartH).toFixed(1)} L${paddingLeft.toFixed(1)},${(paddingTop + chartH).toFixed(1)} Z`;

    // X axis labels: 0:00, 6:00, 12:00, 18:00, 24:00 (5 ticks)
    const xTicks = [0, 6, 12, 18, 23].map((idx) => {
        const x = paddingLeft + (idx / (data.length - 1)) * chartW;
        const label = idx === 23 ? "24:00" : data[idx]?.label ?? `${idx}:00`;
        return { x, label };
    });

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
                    <defs>
                        <linearGradient id="activity-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-home)" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="var(--color-home)" stopOpacity="0.03" />
                        </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path d={areaPath} fill="url(#activity-gradient)" />

                    {/* Line */}
                    <path d={linePath} fill="none" stroke="var(--color-home)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

                    {/* Data points for non-zero values */}
                    {points.map((p, i) =>
                        data[i].count > 0 ? (
                            <circle key={i} cx={p.x} cy={p.y} r="2" fill="var(--color-home)" />
                        ) : null
                    )}

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
            </div>
        </div>
    );
}
