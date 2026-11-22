import { config } from "./config";
import type { PlatformKey } from "./platforms";

export type ProfileKey = keyof typeof config.profiles & PlatformKey;

/** 外部プロフィールの表示順 (ホーム冒頭・フッター)。よく使うものを先に */
export const PROFILE_ORDER: ProfileKey[] = [
    "github",
    "x",
    "zenn",
    "hatena",
    "note",
    "hatenabookmark",
    "booklog",
    "filmarks",
    "spotify",
    "soundcloud",
    "duolingo",
    "playstation",
    "steam",
    "ff14",
    "tenhou",
    "swarm",
];

/** リンク先が本人のプロフィールではないもの (天鳳は個人ページが無くトップに飛ばしている) */
const NOT_A_PROFILE = new Set<ProfileKey>(["tenhou"]);

/** リンク先が本人のプロフィールか (rel="me" と sameAs に入れてよいか) */
export function isOwnProfile(key: ProfileKey): boolean {
    return !NOT_A_PROFILE.has(key);
}

export function profileUrl(key: ProfileKey): string {
    const profile = config.profiles[key];
    return "lodestoneUrl" in profile ? profile.lodestoneUrl : profile.url;
}

/** Person.sameAs に入れる URL。画面のプロフィール一覧と同じ並び・同じ URL から作る (食い違わせない) */
export function sameAsUrls(): string[] {
    return PROFILE_ORDER.filter(isOwnProfile).map(profileUrl);
}
