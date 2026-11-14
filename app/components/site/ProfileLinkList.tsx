import { config } from "@/app/lib/config";
import { platformLabel, type PlatformKey } from "@/app/lib/platforms";

type ProfileKey = keyof typeof config.profiles & PlatformKey;

/** 表示順。よく使うものを先に */
const ORDER: ProfileKey[] = [
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

function profileUrl(key: ProfileKey): string {
    const profile = config.profiles[key];
    return "lodestoneUrl" in profile ? profile.lodestoneUrl : profile.url;
}

/** 外部サービスのプロフィールへのリンク一覧 (ホーム冒頭とフッター) */
export default function ProfileLinkList({ label = "外部のプロフィール" }: { label?: string }) {
    return (
        <nav className="profile-links" aria-label={label}>
            <ul role="list">
                {ORDER.map((key) => (
                    <li key={key}>
                        <a href={profileUrl(key)} target="_blank" rel="noopener noreferrer" data-platform={key}>
                            {platformLabel(key, true)}
                            <span className="visually-hidden">（新しいタブで開く）</span>
                            <svg className="profile-links-icon" aria-hidden="true" viewBox="0 0 12 12" width="10" height="10">
                                <path d="M4 2h6v6M10 2 3 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
