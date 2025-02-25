import { faTwitter } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface XWidgetProps extends React.PropsWithChildren {}

export default function XWidget({}: XWidgetProps) {
    const username = "satory074"; // Replace with the actual X username
    const profileUrl = `https://twitter.com/${username}`;

    return (
        <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold mb-2">X (Twitter)</h2>
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <FontAwesomeIcon icon={faTwitter} className="w-6 h-6 mr-2" />
                <p className="text-gray-600 dark:text-gray-300">@{username}</p>
            </a>
        </div>
    );
}
