import type { MetadataRoute } from "next";
import { SITEMAP_PATHS } from "./lib/navigation";

export const dynamic = "force-static";

const BASE_URL = "https://satory074.com";
/** 検索に出さないページ (metadata で noindex にしている) */
const NOINDEX_PATHS = new Set(["/alco/"]);

/**
 * サイトマップはナビの台帳 (navigation.ts) から作る。
 * 以前は存在しない /about と /posts が入り、実在するページは /x しか載っていなかった。
 */
export default function sitemap(): MetadataRoute.Sitemap {
    return SITEMAP_PATHS.filter((path) => !NOINDEX_PATHS.has(path)).map((path) => ({
        url: `${BASE_URL}${path}`,
        changeFrequency: "daily",
        priority: path === "/" ? 1 : 0.7,
    }));
}
