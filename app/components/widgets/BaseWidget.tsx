import { ReactNode } from "react";

interface BaseWidgetProps {
    title: string;
    icon: ReactNode;
    link: string;
    username: string;
}

export default function BaseWidget({ title, icon, link, username }: BaseWidgetProps) {
    return (
        <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold mb-2">{title}</h2>
            <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center">
                {icon}
                <p className="text-gray-600 dark:text-gray-300">{username}</p>
            </a>
        </div>
    );
}
