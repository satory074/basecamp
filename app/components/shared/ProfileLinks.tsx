import ExternalProfileLink from "./ExternalProfileLink";

const links: { platform: Parameters<typeof ExternalProfileLink>[0]["platform"]; label: string }[] = [
    { platform: "github", label: "GitHub" },
    { platform: "hatena", label: "Hatena" },
    { platform: "zenn", label: "Zenn" },
    { platform: "note", label: "Note" },
    { platform: "hatenabookmark", label: "はてブ" },
    { platform: "x", label: "X" },
    { platform: "duolingo", label: "Duolingo" },
    { platform: "soundcloud", label: "SoundCloud" },
    { platform: "spotify", label: "Spotify" },
    { platform: "booklog", label: "Booklog" },
    { platform: "filmarks", label: "Filmarks" },
    { platform: "tenhou", label: "天鳳" },
    { platform: "ff14", label: "FF14" },
    { platform: "steam", label: "Steam" },
];

export default function ProfileLinks() {
    return (
        <nav aria-label="ソーシャルリンク" className="flex flex-wrap gap-1.5 mt-3">
            {links.map(({ platform, label }) => (
                <ExternalProfileLink key={platform} platform={platform} platformLabel={label} variant="pill" />
            ))}
        </nav>
    );
}
