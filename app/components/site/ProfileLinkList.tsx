import { platformLabel } from "@/app/lib/platforms";
import { PROFILE_ORDER, isOwnProfile, profileUrl } from "@/app/lib/profiles";

/**
 * 外部サービスのプロフィールへのリンク一覧 (ホーム冒頭とフッター)。
 * rel="me" は「リンク先も同じ本人」の印。並びと URL は JSON-LD の Person.sameAs と同じ (profiles.ts)
 */
export default function ProfileLinkList({ label = "外部のプロフィール" }: { label?: string }) {
    return (
        <nav className="profile-links" aria-label={label}>
            <ul role="list">
                {PROFILE_ORDER.map((key) => (
                    <li key={key}>
                        <a href={profileUrl(key)} target="_blank" rel={isOwnProfile(key) ? "me noopener noreferrer" : "noopener noreferrer"} data-platform={key}>
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
