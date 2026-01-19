"use client";

import dynamic from "next/dynamic";

const FF14Character = dynamic(() => import("@/app/components/FF14Character"), {
    ssr: false,
    loading: () => <div className="py-12 text-center text-gray-500">読み込み中...</div>
});

export default function FF14Client() {
    return <FF14Character />;
}
