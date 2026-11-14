import "./variant-a.css";
import SiteHeader from "../_parts/SiteHeader";
import { SiteFooter } from "../_parts/Chrome";
import SchemeFromQuery from "../_parts/SchemeFromQuery";

/** A 案の枠。本番では app/layout.tsx がこの形 (ヘッダー → 本文 → フッター) になる */
export default function VariantALayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="va">
            <SchemeFromQuery />
            <SiteHeader stripPrefix="/design-mockups/a" />
            {children}
            <SiteFooter />
        </div>
    );
}
