"use client";

export default function SoundCloudPlayer() {
    return (
        <div>
            <h2>SoundCloud Player</h2>
            <iframe
                width="100%"
                height="300"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/satory074&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
            >
            </iframe>
        </div>
    );
}
