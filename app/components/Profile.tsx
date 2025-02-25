"use client";

import Image from "next/image";

export default function Profile() {
    return (
        <div>
            <div className="relative w-32 h-32 mb-4">
                <Image
                    src="/images/profile.png"
                    alt="Profile"
                    className="rounded-full"
                    fill
                    sizes="(max-width: 768px) 100vw, 128px"
                    priority
                />
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
