import FF14Character from "@/app/components/FF14Character";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import FF14Icon from "@/app/components/icons/FF14Icon";
import Link from "next/link";

export const metadata = {
    title: "FF14キャラクター - Basecamp",
    description: "ファイナルファンタジーXIVのキャラクター情報",
};

export default function FF14Page() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                        <FF14Icon className="w-8 h-8 text-purple-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        FF14キャラクター
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        ファイナルファンタジーXIVでの冒険記録
                    </p>
                    <div className="mt-4 space-x-4">
                        <Link
                            href="https://jp.finalfantasyxiv.com/lodestone/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-200"
                        >
                            <FF14Icon className="w-5 h-5" />
                            Lodestoneを見る
                        </Link>
                        <Link
                            href="https://jp.finalfantasyxiv.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                        >
                            公式サイト
                        </Link>
                    </div>
                </div>
                <FF14Character />
            </main>
            <Footer />
        </div>
    );
}