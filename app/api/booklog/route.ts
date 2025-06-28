import { NextResponse } from "next/server";
import { Post } from "@/app/lib/types";

export const revalidate = 3600; // ISR: 1時間ごとに再検証

interface BooklogBook {
    id: string;
    asin: string;
    title: string;
    author: string;
    publisher: string;
    genre: string;
    ranking: string; // 0-5の評価
    review: string;
    url: string;
    image: string;
    catalog: string;
}

interface BooklogResponse {
    tana: {
        name: string;
        account: string;
        image: string;
    };
    books: BooklogBook[];
}

export async function GET() {
    try {
        const username = "satory074";
        // 非公式のJSON APIを使用
        const apiUrl = `http://api.booklog.jp/v2/json/${username}?count=20`;
        
        const response = await fetch(apiUrl, {
            next: { revalidate: 3600 },
            headers: {
                "User-Agent": "Basecamp/1.0",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Booklog data: ${response.status}`);
        }

        const data: BooklogResponse = await response.json();
        
        // booksが存在しない場合の処理
        if (!data.books || !Array.isArray(data.books)) {
            console.warn("No books found in Booklog response");
            return NextResponse.json([]);
        }
        
        // Post型に変換
        const posts: Post[] = data.books
            .filter((book) => book && book.title) // 有効な本のみフィルタリング
            .map((book, index) => {
                // ユニークなIDを生成
                const uniqueId = book.id || book.asin || `${book.title}-${index}`.replace(/\s+/g, '-');
                
                return {
                    id: `booklog-${uniqueId}`,
                    title: book.title || "タイトル不明",
                    url: book.url || `https://booklog.jp/users/${username}`,
                    date: new Date().toISOString(),
                    platform: "booklog" as const,
                    description: book.review || `著者: ${book.author || "不明"}${book.ranking && book.ranking !== "0" ? ` | 評価: ${"★".repeat(parseInt(book.ranking))}` : ""}`,
                    thumbnail: book.image || "/placeholder-book.png",
                    data: {
                        author: book.author || "不明",
                        publisher: book.publisher || "",
                        genre: book.genre || "",
                        rating: book.ranking ? parseInt(book.ranking) : 0,
                        asin: book.asin || "",
                    },
                };
            });

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Error fetching Booklog data:", error);
        
        // フォールバック: 空の配列を返す
        return NextResponse.json([]);
    }
}

