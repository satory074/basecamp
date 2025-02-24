"use client";

import { useEffect, useState } from "react";

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
            <a href={profile.url} target="_blank" rel="noopener noreferrer">
                {profile.avatar_url && <img src={profile.avatar_url} alt="GitHub Avatar" className="rounded-full w-20 h-20 mb-2" />}
                <p className="text-gray-600 dark:text-gray-300">{profile.username}</p>
            </a>
        </div>
    );
}
