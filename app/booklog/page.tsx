import BooklogPosts from "@/app/components/BooklogPosts";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import BooklogIcon from "@/app/components/icons/BooklogIcon";

export const metadata = {
    title: "読書記録 - Basecamp",
    description: "ブクログで管理している読書記録一覧",
};

export default function BooklogPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 mb-4">
                        <BooklogIcon className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        読書記録
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        ブクログで管理している本の記録
                    </p>
                </div>
                <BooklogPosts />
            </main>
            <Footer />
        </div>
    );
}