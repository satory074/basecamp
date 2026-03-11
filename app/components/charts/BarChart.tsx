export interface BarDatum {
    label: string;
    value: number;
    color?: string;
}

interface BarChartProps {
    data: BarDatum[];
    platformColor?: string;
    horizontal?: boolean;
    title?: string;
    height?: number;
}

export default function BarChart({
    data,
    platformColor = "var(--color-text-muted)",
    horizontal = false,
    title,
    height = 120,
}: BarChartProps) {
    if (data.length === 0) return null;
    const maxVal = Math.max(...data.map((d) => d.value), 1);

    if (horizontal) {
        const labelWidth = 110;
        const valueWidth = 36;
        const barAreaWidth = 220;
        const rowHeight = 22;
        const svgHeight = data.length * rowHeight;

        return (
            <div>
                {title && <div className="chart-section-title">{title}</div>}
                <div className="chart-container chart-bar">
                    <svg
                        width={labelWidth + barAreaWidth + valueWidth}
                        height={svgHeight}
                        style={{ display: "block" }}
                    >
                        {data.map((d, i) => {
                            const barW = (d.value / maxVal) * barAreaWidth;
                            const y = i * rowHeight;
                            const color = d.color ?? platformColor;
                            return (
                                <g key={i}>
                                    <text
                                        x={labelWidth - 6}
                                        y={y + rowHeight / 2 + 1}
                                        fontSize="10"
                                        fill="var(--color-text-secondary)"
                                        textAnchor="end"
                                        dominantBaseline="middle"
                                    >
                                        {d.label.length > 14 ? d.label.slice(0, 13) + "…" : d.label}
                                    </text>
                                    <rect
                                        x={labelWidth}
                                        y={y + 4}
                                        width={Math.max(barW, 2)}
                                        height={rowHeight - 8}
                                        fill={color}
                                        rx="1"
                                    />
                                    <text
                                        x={labelWidth + barW + 4}
                                        y={y + rowHeight / 2 + 1}
                                        fontSize="10"
                                        fill="var(--color-text)"
                                        dominantBaseline="middle"
                                        fontWeight="600"
                                    >
                                        {d.value}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        );
    }

    // Vertical
    const barWidth = Math.max(24, Math.floor(260 / data.length) - 6);
    const gap = 6;
    const svgWidth = data.length * (barWidth + gap) + gap;

    return (
        <div>
            {title && <div className="chart-section-title">{title}</div>}
            <div className="chart-container chart-bar">
                <svg width={svgWidth} height={height + 28} style={{ display: "block" }}>
                    {data.map((d, i) => {
                        const barH = (d.value / maxVal) * height;
                        const x = gap + i * (barWidth + gap);
                        const y = height - barH;
                        const color = d.color ?? platformColor;
                        return (
                            <g key={i}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={Math.max(barH, 2)}
                                    fill={color}
                                    rx="1"
                                />
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 3}
                                    fontSize="9"
                                    fill="var(--color-text)"
                                    textAnchor="middle"
                                    fontWeight="600"
                                >
                                    {d.value}
                                </text>
                                <text
                                    x={x + barWidth / 2}
                                    y={height + 12}
                                    fontSize="9"
                                    fill="var(--color-text-secondary)"
                                    textAnchor="middle"
                                >
                                    {d.label.length > 6 ? d.label.slice(0, 5) + "…" : d.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
