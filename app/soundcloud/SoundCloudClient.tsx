"use client";

import { config } from "../lib/config";

export default function SoundCloudClient() {
    const username = config.profiles.soundcloud.username;

    return (
        <div className="border border-gray-200">
            <iframe
                title="SoundCloud Player"
                width="100%"
                height="500"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/${username}&color=%23000000&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`}
            />
        </div>
    );
}
