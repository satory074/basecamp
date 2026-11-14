import "./variant-b.css";
import SiteHeader from "../_parts/SiteHeader";
import { SiteFooter } from "../_parts/Chrome";
import SchemeFromQuery from "../_parts/SchemeFromQuery";

/** B 案の枠。本番では app/layout.tsx がこの形 (ヘッダー → 本文 → フッター) になる */
export default function VariantBLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="vb">
            <SchemeFromQuery />
            <SiteHeader stripPrefix="/design-mockups/b" />
            {children}
            <SiteFooter />
        </div>
    );
}
