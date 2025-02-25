"use client";

import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BaseWidget from "./widgets/BaseWidget";

export default function GithubWidget() {
    const username = "satory074";

    return (
        <BaseWidget
            title="GitHub"
            icon={<FontAwesomeIcon icon={faGithub} className="w-6 h-6 mr-2" />}
            link={`https://github.com/${username}`}
            username={username}
        />
    );
}
