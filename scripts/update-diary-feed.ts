/**
 * 日記 (デイリーログ) v2 生成スクリプト
 *
 * 対象日 (JST 暦日) の本人の活動を各ソースから集め、決定論的にハイライト (最大 5 件) と stat ピルを計算し、
 * Gemini には見出し 1 行と導入 1〜2 文だけを書かせて diary-feed.json に保存する。
 *
 *   collect (facts) → detect (candidates/stats) → select (top 5) → Gemini headline/lede
 *     → grounding check → (NG ならテンプレ見出し) → entry v2 → GCS
 *
 * - Gemini の材料は計算済みの事実テキストのみ。感想・質問・推測は禁止し、事実に無い固有名詞や数値が
 *   混ざった出力は捨ててテンプレ見出しにフォールバックする (エントリは必ず出る)
 * - X のいいね / ブックマークは件数だけ。他人の投稿本文は載せない
 * - ハイライトが 0 件の日は「記録なし」の最小エントリ (継続ピルのみ)
 *
 * 環境変数:
 *   GEMINI_API_KEY   - 見出し生成用。無ければテンプレ見出し
 *   GITHUB_TOKEN     - GitHub API のレート制限緩和 (Actions では secrets.GITHUB_TOKEN)
 *   TARGET_DATE      - YYYY-MM-DD。過去日のバックフィル用 (省略時は実行日、JST 0〜4 時は前日)
 *   DIARY_FORCE=1    - 既存 v2 エントリがあっても作り直す
 *   DIARY_NO_LLM=1   - Gemini を呼ばずテンプレ見出しにする (ローカル確認用)
 *   DIARY_DRY_RUN=1  - 書き込まずにエントリ JSON を stdout に出す
 *   DISCORD_WEBHOOK_URL / DISCORD_DRY_RUN - 通知
 */

import type { DiaryEntry, DiaryFeedData } from "../app/lib/diary-types";
import { notifyDiscord } from "./lib/discord-notification";
import { readFeed, writeFeed } from "./lib/feed-storage";
import { GeminiError, generateJson } from "./lib/gemini";
import { collectFacts } from "./lib/diary/collect";
import {
    RESPONSE_SCHEMA,
    buildContent,
    buildFactsText,
    buildPrompt,
    checkGrounding,
    selectHighlights,
    selectStats,
    templateHeadline,
} from "./lib/diary/compose";
import { dayWindow, resolveTargetDayKey } from "./lib/diary/day";
import { detectFacts } from "./lib/diary/facts";

const FEED_FILE = "diary-feed.json";
const MAX_ENTRIES = 365;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

interface HeadlineResult {
    headline: string;
    lede?: string;
    ledeSource: NonNullable<DiaryEntry["ledeSource"]>;
}

async function writeHeadline(
    factsText: string,
    highlights: DiaryEntry["highlights"],
): Promise<HeadlineResult> {
    const fallback = (): HeadlineResult => ({ headline: templateHeadline(highlights ?? []), ledeSource: "template" });

    if (process.env.DIARY_NO_LLM === "1") {
        console.log("DIARY_NO_LLM=1: using template headline");
        return fallback();
    }
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not set: using template headline");
        return fallback();
    }

    try {
        const out = await generateJson<{ headline?: string; lede?: string }>(buildPrompt(factsText), {
            model: GEMINI_MODEL,
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseSchema: RESPONSE_SCHEMA,
        });
        const candidate = { headline: (out.headline ?? "").trim(), lede: (out.lede ?? "").trim() };
        const grounding = checkGrounding(candidate, factsText);
        if (!grounding.ok) {
            console.warn(`Gemini output rejected by grounding check: ${grounding.reasons.join("; ")}`);
            console.warn(`  rejected: ${JSON.stringify(candidate)}`);
            return fallback();
        }
        return { headline: candidate.headline, lede: candidate.lede || undefined, ledeSource: "gemini" };
    } catch (e) {
        const msg = e instanceof GeminiError ? e.message : e instanceof Error ? e.message : String(e);
        console.warn(`Gemini failed, using template headline: ${msg}`);
        return fallback();
    }
}

async function main() {
    const force = process.env.DIARY_FORCE === "1";
    const dryRun = process.env.DIARY_DRY_RUN === "1";

    const dayKey = resolveTargetDayKey();
    const window = dayWindow(dayKey);
    const entryId = `diary-${dayKey}`;
    // その日の先頭に並ぶよう 23:59:59 JST に固定
    const entryDate = `${dayKey}T14:59:59.000Z`;

    console.log(`Generating diary entry for ${dayKey} (${window.weekday})...`);

    const feed = await readFeed<DiaryFeedData>(FEED_FILE, { lastUpdated: new Date().toISOString(), entries: [] });
    const existing = feed.entries.find((e) => e.id === entryId);
    if (existing?.version === 2 && !force) {
        console.log(`Entry ${entryId} already exists (v2), skipping. Set DIARY_FORCE=1 to regenerate.`);
        return;
    }
    if (existing) {
        console.log(`Entry ${entryId} exists (${existing.version === 2 ? "v2, forced" : "v1"}), will be replaced.`);
    }

    console.log("Collecting facts...");
    const facts = await collectFacts(window);
    console.log(`Sources with activity: ${Object.keys(facts).join(", ") || "(none)"}`);

    const { candidates, stats: allStats } = detectFacts(facts);
    const highlights = selectHighlights(candidates);
    const stats = selectStats(allStats);
    const empty = highlights.length === 0;
    console.log(`Highlights: ${highlights.length} (of ${candidates.length} candidates), stats: ${stats.length}`);
    for (const h of highlights) console.log(`  [${h.kind}] ${h.icon} ${h.text}`);

    let result: HeadlineResult;
    let factsText = "";
    if (empty) {
        result = { headline: "記録なし", ledeSource: "none" };
    } else {
        factsText = buildFactsText(window, highlights, stats);
        result = await writeHeadline(factsText, highlights);
    }
    console.log(`Headline (${result.ledeSource}): ${result.headline}`);
    if (result.lede) console.log(`Lede: ${result.lede}`);

    const entry: DiaryEntry = {
        id: entryId,
        date: entryDate,
        title: result.headline,
        content: empty ? "" : buildContent(result.lede, highlights),
        version: 2,
        headline: result.headline,
        ledeSource: result.ledeSource,
        empty,
        highlights,
        stats,
        facts,
    };
    if (result.lede) entry.lede = result.lede;
    const thumbnail = highlights.find((h) => h.thumbnail)?.thumbnail;
    if (thumbnail) entry.thumbnail = thumbnail;

    if (dryRun) {
        console.log("DIARY_DRY_RUN=1: not writing. Entry:");
        console.log(JSON.stringify(entry, null, 2));
        return;
    }

    feed.entries = [entry, ...feed.entries.filter((e) => e.id !== entryId)]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, MAX_ENTRIES);
    feed.lastUpdated = new Date().toISOString();
    await writeFeed(FEED_FILE, feed);
    console.log(`Saved to ${FEED_FILE}`);

    await notifyDiscord({
        source: "Diary",
        status: "success",
        summary: `${dayKey}: ${result.headline}`,
        metrics: [
            {
                name: "ハイライト",
                value: empty ? "なし" : highlights.map((h) => `${h.icon} ${h.text}`).join("\n").slice(0, 1000),
                inline: false,
            },
            {
                name: "数値",
                value: stats.length > 0 ? stats.map((s) => `${s.icon} ${s.label} ${s.value}`).join(" / ") : "なし",
                inline: false,
            },
            { name: "生成", value: result.ledeSource === "gemini" ? `gemini (${GEMINI_MODEL})` : result.ledeSource, inline: true },
        ],
    });
}

main().catch(async (error: unknown) => {
    console.error("Fatal error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    await notifyDiscord({
        source: "Diary",
        status: "error",
        errors: [errorMsg],
    }).catch(() => {});
    process.exit(1);
});
