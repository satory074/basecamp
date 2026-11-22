import type { MetadataRoute } from "next";
import { SITEMAP_PATHS } from "./lib/navigation";
import { SEASON_MONTHS, getNpbGames, monthKeys } from "./lib/feeds/npb";
import { config } from "./lib/config";

export const dynamic = "force-static";

/** 検索に出さないページ (metadata で noindex にしている) */
const NOINDEX_PATHS = new Set(["/alco/"]);
/** ナビの台帳に無いが検索に出すページ */
const EXTRA_PATHS = ["/ff14-achievements/"];

/**
 * サイトマップはナビの台帳 (navigation.ts) から作る。
 * 以前は存在しない /about と /posts が入り、実在するページは /x しか載っていなかった。
 * changefreq / priority は Google が使わないので書かない。
 * 載せ漏れ・noindex の混入は scripts/seo-check.mjs が deploy 前に止める。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // /baseball/MM/ は app/baseball/[month]/page.tsx の generateStaticParams と同じ月の一覧
    const months = monthKeys(await getNpbGames());
    const baseballMonths = (months.length > 0 ? months : SEASON_MONTHS).map((m) => `/baseball/${m}/`);

    return [...SITEMAP_PATHS, ...EXTRA_PATHS, ...baseballMonths]
        .filter((path) => !NOINDEX_PATHS.has(path))
        .map((path) => ({ url: `${config.siteUrl}${path}` }));
}
