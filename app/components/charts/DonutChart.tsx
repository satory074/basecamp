export interface DonutSlice {
    label: string;
    value: number;
    color: string;
}

interface DonutChartProps {
    slices: DonutSlice[];
    centerLabel?: string;
    centerSubLabel?: string;
    title?: string;
    size?: number;
}

export default function DonutChart({
    slices,
    centerLabel,
    centerSubLabel,
    title,
    size = 130,
}: DonutChartProps) {
    const total = slices.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) return null;

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.46;
    let cumulative = 0;

    const paths = slices.map((slice, i) => {
        const startAngle = (cumulative / total) * 360;
        const endAngle = ((cumulative + slice.value) / total) * 360;
        cumulative += slice.value;

        const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;
        const startRad = ((startAngle - 90) * Math.PI) / 180;
        const endRad = ((endAngle - 90) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);

        return (
            <path
                key={i}
                d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={slice.color}
                stroke="rgba(0,0,0,0.08)"
                strokeWidth="1"
            />
        );
    });

    const innerR = r * 0.54;

    return (
        <div>
            {title && <div className="chart-section-title">{title}</div>}
            <div className="chart-container chart-donut">
                <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
                    <svg width={size} height={size}>
                        {paths}
                        <circle cx={cx} cy={cy} r={innerR} fill="var(--color-background)" />
                    </svg>
                    {(centerLabel || centerSubLabel) && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                pointerEvents: "none",
                            }}
                        >
                            {centerLabel && (
                                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text)", lineHeight: 1 }}>
                                    {centerLabel}
                                </span>
                            )}
                            {centerSubLabel && (
                                <span style={{ fontSize: "0.65rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                                    {centerSubLabel}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="chart-legend">
                    {slices.map((slice, i) => (
                        <div key={i} className="chart-legend-item">
                            <span className="chart-legend-swatch" style={{ backgroundColor: slice.color }} />
                            <span>{slice.label}</span>
                            <span className="chart-legend-value">{slice.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
