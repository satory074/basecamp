import { Metadata } from "next";
import { pageMetadata } from "../lib/navigation";
import { PageHeader } from "../components/site/SiteChrome";
import BooklogClient from "./BooklogClient";
import { getBooklogPosts } from "../lib/feeds/booklog";

export const metadata: Metadata = pageMetadata("booklog", "Booklog読書記録");

export default async function BooklogPage() {
    const posts = await getBooklogPosts();
    const highRatedBooks = posts
        .filter((p) => p.rating === 5)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="page">
                    <PageHeader platform="booklog" description="読書記録" />

                    {/* Books */}
                    <BooklogClient highRatedBooks={highRatedBooks} />
                </div>
    );
}
