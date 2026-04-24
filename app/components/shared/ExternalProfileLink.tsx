import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { config } from "../../lib/config";

type ProfileKey = keyof typeof config.profiles;

interface ExternalProfileLinkProps {
    platform: ProfileKey;
    platformLabel: string;
}

export default function ExternalProfileLink({ platform, platformLabel }: ExternalProfileLinkProps) {
    const profile = config.profiles[platform];

    const url = "lodestoneUrl" in profile ? profile.lodestoneUrl : profile.url;
    const displayName = "characterName" in profile ? profile.characterName : profile.username;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${platformLabel}の${displayName}のプロフィールを新しいタブで開く`}
            title={`${platformLabel}の${displayName}のプロフィール`}
            className="inline-flex items-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-sm"
        >
            <ArrowTopRightOnSquareIcon className="w-5 h-5" aria-hidden="true" />
        </a>
    );
}
