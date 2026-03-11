"use client";

import React from "react";

export interface StatItem {
    label: string;
    value: string | number;
}

interface PlatformDashboardProps {
    platform: string; // CSS変数のプラットフォームキー (e.g. "github", "spotify")
    stats: StatItem[];
}

export default function PlatformDashboard({ platform, stats }: PlatformDashboardProps) {
    return (
        <div
            className="platform-dashboard"
            style={{ borderLeftColor: `var(--color-${platform})` }}
        >
            {stats.map((stat, i) => (
                <div key={i} className="platform-dashboard-stat">
                    <span className="platform-dashboard-value">{stat.value}</span>
                    <span className="platform-dashboard-label">{stat.label}</span>
                </div>
            ))}
        </div>
    );
}
