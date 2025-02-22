// components/SoundCloudPlayer.tsx

import { Suspense } from "react";

const SoundCloudPlayer = () => {
    return (
        <div className="soundcloud-player my-8">
            <h2 className="text-2xl font-semibold mb-4">My Music</h2>
            <Suspense fallback={<div>Loading...</div>}>
                <iframe
                    width="100%"
                    height="300"
                    scrolling="no"
                    frameBorder="no"
                    allow="autoplay"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/651754767&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
                    title="SoundCloud Player"
                    loading="lazy"
                />
            </Suspense>
            <div className="text-xs text-gray-400 mt-2">
                <a
                    href="https://soundcloud.com/satory43"
                    title="satory074"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-600"
                >
                    satory074
                </a>
                {" · "}
                <a
                    href="https://soundcloud.com/satory43/sets/mashup"
                    title="Mashup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-600"
                >
                    Mashup
                </a>
            </div>
        </div>
    );
};

export default SoundCloudPlayer;
