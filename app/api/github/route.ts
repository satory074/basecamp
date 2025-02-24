import { NextResponse } from "next/server";

export async function GET() {
    const username = "satory074"; // Replace with your GitHub username
    try {
        const response = await fetch("https://api.github.com/users/" + username + "/events/public");
        if (!response.ok) {
            throw new Error("Failed to fetch GitHub activity: " + response.status);
        }
        const activity = await response.json();
        return NextResponse.json(activity);
    } catch (error) {
        console.error("Failed to fetch GitHub activity:", error);
        return NextResponse.json({ error: "Failed to fetch GitHub activity" }, { status: 500 });
    }
}
