/**
 * 日記 v2: ハイライトの選抜、Gemini プロンプト、grounding チェック、テンプレ見出し。
 *
 * Gemini が書くのは headline (1 行) と lede (1〜2 文) だけ。材料は `buildFactsText` が作る事実テキストのみで、
 * 出力に事実テキストに無い固有名詞・数値・禁止語が混ざっていたら `checkGrounding` が落として
 * `templateHeadline` にフォールバックする (LLM が壊れてもエントリは必ず出る)。
 */

import type { DiaryFactKind, DiaryHighlight, DiaryStat } from "../../../app/lib/diary-types";
import type { DayWindow } from "./day";
import { formatJpDate } from "./day";
import type { FactCandidate } from "./facts";

export const MAX_HIGHLIGHTS = 5;
export const MAX_STATS = 6;
export const MAX_HEADLINE_CHARS = 40;
export const MAX_LEDE_CHARS = 120;

const KIND_LABEL: Record<DiaryFactKind, string> = {
    first: "初",
    milestone: "節目",
    creation: "活動",
    record: "記録",
    delta: "増加",
    routine: "日常",
};

const PLATFORM_LABEL: Record<string, string> = {
    zenn: "Zenn",
    hatena: "はてなブログ",
    note: "note",
    booklog: "Booklog",
    github: "GitHub",
    x: "X",
    filmarks: "Filmarks",
    steam: "Steam",
    playstation: "PlayStation",
    "ff14-achievement": "FF14",
    tenhou: "天鳳",
    spotify: "Spotify",
    swarm: "Swarm",
    duolingo: "Duolingo",
    alco: "飲酒記録",
};

export function selectHighlights(candidates: FactCandidate[], max = MAX_HIGHLIGHTS): DiaryHighlight[] {
    return candidates
        .map((cand, index) => ({ cand, index }))
        .sort((a, b) => b.cand.priority - a.cand.priority || a.cand.order - b.cand.order || a.index - b.index)
        .slice(0, max)
        .map(({ cand }) => {
            const h: DiaryHighlight = { kind: cand.kind, platform: cand.platform, icon: cand.icon, text: cand.text };
            if (cand.url) h.url = cand.url;
            if (cand.thumbnail) h.thumbnail = cand.thumbnail;
            return h;
        });
}

export function selectStats(stats: DiaryStat[], max = MAX_STATS): DiaryStat[] {
    return stats.slice(0, max);
}

/** Gemini に渡す事実テキスト。これ以外の情報は一切渡さない */
export function buildFactsText(w: DayWindow, highlights: DiaryHighlight[], stats: DiaryStat[]): string {
    const lines: string[] = [`【${formatJpDate(w.dayKey)}（${w.weekday}）の事実（重要度順）】`];
    highlights.forEach((h, i) => {
        lines.push(`${i + 1}. [${KIND_LABEL[h.kind]}] ${h.text} (${PLATFORM_LABEL[h.platform] ?? h.platform})`);
    });
    if (stats.length > 0) {
        lines.push("【継続・数値】");
        for (const s of stats) lines.push(`- ${s.label}: ${s.value}`);
    }
    return lines.join("\n");
}

export const RESPONSE_SCHEMA = {
    type: "OBJECT",
    properties: {
        headline: { type: "STRING" },
        lede: { type: "STRING" },
    },
    required: ["headline", "lede"],
} as const;

export function buildPrompt(factsText: string): string {
    return `あなたは個人の活動ログの編集者です。下の「事実」だけを材料にして、その日を要約する見出しと導入文を JSON で返してください。

出力形式: {"headline": "...", "lede": "..."}
- headline: 32 文字以内。体言止め。番号の小さい (重要な) 事実を 1〜2 件だけ使う
- lede: 1〜2 文、合計 90 文字以内。常体 (「〜した」「〜だった」)。事実の言い換えのみ

禁止事項:
- 事実に無い固有名詞・数値・出来事を足す
- 感想・評価・賞賛・励まし・心配 (「すごい」「頑張った」「お疲れ」など)
- 疑問文、呼びかけ、二人称 (「あなた」「君」)
- 推測 (「〜だろう」「〜かも」「〜らしい」)
- 作品・記事・リンク先の内容への言及
- 絵文字、「笑」などの口語、です・ます調

作品名・曲名・場所名は事実の表記をそのまま「」や『』で囲んで使ってください。
事実が 1 件しかない日は headline も lede もその 1 件だけで短く書いてください。

例 1
事実:
1. [初] Palworld で初実績「初心者パルテイマー」 (Steam)
2. [活動] Zenn「Claude Code のセキュリティ設定」を公開 (Zenn)
3. [活動] basecamp に 5 commits（連続 3 日目） (GitHub)
4. [増加] Spotify 41 曲再生（28 日平均 12）— The Birthday が最多 (Spotify)
出力:
{"headline": "Zenn 記事を公開、Palworld 初プレイ", "lede": "Zenn に「Claude Code のセキュリティ設定」を公開した。Steam では Palworld で初めての実績を解除し、basecamp への commit は 3 日連続。"}

例 2
事実:
1. [日常] 『ザ・ゴール』を「読みたい」に追加 (Booklog)
出力:
{"headline": "『ザ・ゴール』を読みたいに追加", "lede": "Booklog で『ザ・ゴール』を読みたい本に追加した。"}

---
${factsText}`;
}

function truncate(text: string, max: number): string {
    const chars = [...text];
    return chars.length > max ? `${chars.slice(0, max - 1).join("")}…` : text;
}

/** LLM 失敗時のフォールバック見出し: 上位 2 件が収まるなら「、」で連結、収まらなければ 1 件目だけ */
export function templateHeadline(highlights: DiaryHighlight[]): string {
    const [first, second] = highlights.map((h) => h.text);
    if (!first) return "記録なし";
    if (second) {
        const joined = `${first}、${second}`;
        if ([...joined].length <= MAX_HEADLINE_CHARS) return joined;
    }
    return truncate(first, MAX_HEADLINE_CHARS);
}

export function buildContent(lede: string | undefined, highlights: DiaryHighlight[]): string {
    return [lede?.trim(), ...highlights.map((h) => `${h.icon} ${h.text}`)].filter(Boolean).join("\n");
}

// ---- Grounding check ----

export interface GroundingResult {
    ok: boolean;
    reasons: string[];
}

const FORBIDDEN = /[?？!！]|笑|あなた|きみ|(?<![一-龠])君|すごい|えらい|尊敬|素晴らし|ナイス|頑張|がんば|おつかれ|お疲れ|楽しみ|かも|だろう|でしょう|らしい|です|でした|ます|ました|ません|ね[。、]|よ[。、]/;

/** 固有名詞ではない一般的なカタカナ語 (事実テキストに無くても許容) */
const ALLOWED_WORDS = new Set([
    "コミット", "リポジトリ", "リリース", "アーティスト", "チェックイン", "プレイ", "ゲーム", "ページ", "フィード",
    "トロフィー", "アチーブメント", "ドラマ", "アニメ", "ストリーク", "マイルストーン", "スコア", "ブックマーク",
    "リポスト", "アプリ", "ブログ", "ツール", "スクリプト", "データ", "サイト", "ファイル", "バージョン", "イベント",
    "プロジェクト", "シリーズ", "エピソード", "アルバム", "プレイリスト", "ポイント", "トップ", "ライブ", "レベル",
    "プラチナ", "ゴールド", "シルバー", "ブロンズ", "ランキング", "サービス", "プラットフォーム", "オンライン",
]);

function normalize(text: string): string {
    return text
        .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
        .replace(/[Ａ-Ｚａ-ｚ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
        .replace(/(\d),(?=\d{3})/g, "$1")
        .replace(/\s+/g, " ")
        .toLowerCase();
}

export function checkGrounding(out: { headline: string; lede: string }, factsText: string): GroundingResult {
    const reasons: string[] = [];
    const headline = (out.headline ?? "").trim();
    const lede = (out.lede ?? "").trim();
    if (!headline) reasons.push("headline empty");
    if ([...headline].length > MAX_HEADLINE_CHARS) reasons.push(`headline too long (${[...headline].length})`);
    if ([...lede].length > MAX_LEDE_CHARS) reasons.push(`lede too long (${[...lede].length})`);
    if ((lede.match(/。/g) ?? []).length > 2) reasons.push("lede has more than 2 sentences");

    const combined = `${headline}\n${lede}`;
    if (/\p{Extended_Pictographic}/u.test(combined)) reasons.push("emoji");

    const facts = normalize(factsText);
    const factsNoSpace = facts.replace(/ /g, "");
    const factNumbers = new Set(facts.match(/\d+/g) ?? []);

    const quoted: string[] = [];
    const unquoted = combined.replace(/「([^」]+)」|『([^』]+)』/g, (_m, a: string | undefined, b: string | undefined) => {
        quoted.push(a ?? b ?? "");
        return " ";
    });
    for (const q of quoted) {
        const nq = normalize(q).replace(/ /g, "");
        if (nq && !factsNoSpace.includes(nq)) reasons.push(`quoted not in facts: ${q}`);
    }

    const unq = normalize(unquoted);
    for (const n of unq.match(/\d+/g) ?? []) {
        if (!factNumbers.has(n)) reasons.push(`number not in facts: ${n}`);
    }
    for (const token of unq.match(/[ァ-ヶー]{3,}|[a-z][a-z0-9.'&_-]{2,}/g) ?? []) {
        if (ALLOWED_WORDS.has(token)) continue;
        if (!facts.includes(token)) reasons.push(`token not in facts: ${token}`);
    }
    const forbidden = unquoted.match(FORBIDDEN);
    if (forbidden) reasons.push(`forbidden expression: ${forbidden[0]}`);

    return { ok: reasons.length === 0, reasons };
}
