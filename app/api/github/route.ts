import { NextResponse } from "next/server";

export async function GET() {
    const username = "satory074"; // Replace with your GitHub username
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
        if (!response.ok) {
            throw new Error("Failed to fetch GitHub repositories: " + response.status);
        }
        const repositories = await response.json();
        return NextResponse.json(repositories);
    } catch (error) {
        console.error("Failed to fetch GitHub activity:", error);
        return NextResponse.json({ error: "Failed to fetch GitHub activity" }, { status: 500 });
    }
}
