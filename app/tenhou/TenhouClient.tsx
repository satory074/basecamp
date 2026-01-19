"use client";

import dynamic from "next/dynamic";

const TenhouStats = dynamic(() => import("@/app/components/TenhouStats"), {
    ssr: false,
    loading: () => <div className="py-12 text-center text-gray-500">読み込み中...</div>
});

export default function TenhouClient() {
    return <TenhouStats />;
}
