import { readFeedJson } from "../feed-storage";

export async function getFF14Character(): Promise<Record<string, unknown> | null> {
    try {
        return await readFeedJson<Record<string, unknown>>("ff14-character.json");
    } catch {
        return null;
    }
}
