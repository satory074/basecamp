"use client";

import dynamic from "next/dynamic";

const BooklogPosts = dynamic(() => import("@/app/components/BooklogPosts"), {
    ssr: false,
    loading: () => <div className="py-12 text-center text-gray-500">読み込み中...</div>
});

export default function BooklogClient() {
    return <BooklogPosts />;
}
