import TenhouStats from "@/app/components/TenhouStats";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import TenhouIcon from "@/app/components/icons/TenhouIcon";
import Link from "next/link";

export const metadata = {
    title: "天鳳戦績 - Basecamp",
    description: "天鳳オンライン麻雀の戦績と統計",
};

export default function TenhouPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 mb-4">
                        <TenhouIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        天鳳戦績
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        オンライン麻雀「天鳳」での戦績と統計
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-4">
                        <Link
                            href="https://tenhou.net/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
                        >
                            <TenhouIcon className="w-5 h-5" />
                            天鳳で対戦する
                        </Link>
                        <Link
                            href="https://nodocchi.moe/tenhoulog/?name=Unbobo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white transition-colors duration-200"
                        >
                            詳細統計を見る
                        </Link>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        <p>※ データは5分ごとに自動更新されます。最新データは「データ更新」ボタンで取得できます。</p>
                    </div>
                </div>
                <TenhouStats />
            </main>
            <Footer />
        </div>
    );
}