"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

export default function GithubWidget() {
    const [profile, setProfile] = useState({
        username: "satory074",
        avatar_url: "",
        url: "https://github.com/satory074",
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("https://api.github.com/users/" + profile.username);
                if (!response.ok) {
                    throw new Error("Failed to fetch GitHub profile: " + response.status);
                }
                const data = await response.json();
                setProfile({
                    username: data.login,
                    avatar_url: data.avatar_url,
                    url: data.html_url,
                });
            } catch (error) {
                console.error("Failed to fetch GitHub profile:", error);
            }
        };

        fetchProfile();
    }, []);

    return (
        <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold mb-2">GitHub</h2>
            <a href={profile.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <FontAwesomeIcon icon={faGithub} className="w-6 h-6 mr-2" />
                <p className="text-gray-600 dark:text-gray-300">{profile.username}</p>
            </a>
        </div>
    );
}
