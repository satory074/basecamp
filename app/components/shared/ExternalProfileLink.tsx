import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { config } from "../../lib/config";

type ProfileKey = keyof typeof config.profiles;

interface ExternalProfileLinkProps {
    platform: ProfileKey;
    platformLabel: string;
    variant?: "icon" | "pill";
}

export default function ExternalProfileLink({ platform, platformLabel, variant = "icon" }: ExternalProfileLinkProps) {
    const profile = config.profiles[platform];

    const url = "lodestoneUrl" in profile ? profile.lodestoneUrl : profile.url;
    const displayName = "characterName" in profile ? profile.characterName : profile.username;

    const ariaLabel = `${platformLabel}の${displayName}のプロフィールを新しいタブで開く`;
    const title = `${platformLabel}の${displayName}のプロフィール`;

    if (variant === "pill") {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={ariaLabel}
                title={title}
                className="platform-tag inline-flex items-center gap-1"
            >
                {platformLabel}
                <ArrowTopRightOnSquareIcon className="w-3 h-3" aria-hidden="true" />
            </a>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ariaLabel}
            title={title}
            className="inline-flex items-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-sm"
        >
            <ArrowTopRightOnSquareIcon className="w-5 h-5" aria-hidden="true" />
        </a>
    );
}
