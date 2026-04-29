import Link from "next/link";
import Image from "next/image";
import type { AppEntry } from "../lib/types";

interface AppsCarouselProps {
    apps: AppEntry[];
}

export default function AppsCarousel({ apps }: AppsCarouselProps) {
    if (apps.length === 0) return null;

    return (
        <section className="apps-carousel" aria-label="作品">
            <div className="apps-carousel-header">
                <h2>作品</h2>
                <Link href="/apps" className="apps-carousel-viewall">
                    すべて見る →
                </Link>
            </div>
            <div className="apps-carousel-track" role="list">
                {apps.map((app) => (
                    <a
                        key={app.id}
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="app-carousel-card"
                        role="listitem"
                        aria-label={`${app.name}を新しいタブで開く`}
                    >
                        <Image
                            src={app.thumbnailPath}
                            alt=""
                            width={280}
                            height={147}
                            className="app-carousel-card-thumb"
                            unoptimized={app.thumbnailPath.endsWith(".svg")}
                        />
                        <div className="app-carousel-card-body">
                            <div className="app-carousel-card-title">{app.name}</div>
                            {app.description && (
                                <div className="app-carousel-card-desc">{app.description}</div>
                            )}
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
