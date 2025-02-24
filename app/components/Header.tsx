// app/components/Header.tsx
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
    return (
        <header className="site-header" role="banner">
            <div className="site-header__container">
                <div className="site-header__content">
                    <Link href="/" className="site-header__logo">
                        <span className="site-header__logo-text">Basecamp</span>
                        <span className="visually-hidden">ホームページへ戻る</span>
                    </Link>

                    <nav className="site-nav" role="navigation" aria-label="メインナビゲーション">
                        <button className="site-nav__button" aria-expanded="false">
                            <span className="site-nav__icon">
                                <span className="visually-hidden">メニューを開く</span>
                            </span>
                            <span className="site-nav__label">メニュー</span>
                        </button>

                        <button className="site-nav__button" aria-expanded="false">
                            <span className="site-nav__icon">
                                <span className="visually-hidden">検索を開く</span>
                            </span>
                            <span className="site-nav__label">検索</span>
                        </button>

                        <ThemeToggle />
                    </nav>
                </div>
            </div>
        </header>
    );
}
