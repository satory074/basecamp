import { readFeedJson } from "../feed-storage";

export async function getSummaries(): Promise<unknown> {
    try {
        return await readFeedJson<unknown>("summaries.json");
    } catch {
        return {};
    }
}
