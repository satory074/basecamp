"use client";

import Image from "next/image";
import { useState } from "react";

export default function Profile() {
    const [imageError, setImageError] = useState(false);

    return (
        <div>
            <div className="relative w-32 h-32 mb-4">
                {!imageError ? (
                    <Image
                        src="/images/profile.png"
                        alt="Profile"
                        className="object-cover"
                        fill
                        sizes="(max-width: 768px) 100vw, 128px"
                        priority
                        onError={() => setImageError(true)}
                        quality={85}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center">
                        <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                            JD
                        </span>
                    </div>
                )}
            </div>
            <h3 className="text-lg font-semibold mt-2">John Doe</h3>
            <p className="text-gray-600 dark:text-gray-300">
                John Doe is a web developer passionate about creating accessible and user-friendly web applications. He
                has experience with various frontend and backend technologies and is always eager to learn new things.
            </p>
            <div className="mt-4"></div>
        </div>
    );
}
