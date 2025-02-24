"use client";

export default function Profile() {
    return (
        <div>
            <img src="/images/profile.png" alt="Profile" className="rounded-full w-32 h-32 mb-4" />
            <h3 className="text-lg font-semibold mt-2">John Doe</h3>
            <p className="text-gray-600 dark:text-gray-300">
                John Doe is a web developer passionate about creating accessible and user-friendly web applications. He
                has experience with various frontend and backend technologies and is always eager to learn new things.
            </p>
            <div className="mt-4">
            </div>
        </div>
    );
}
