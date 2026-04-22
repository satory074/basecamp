/**
 * Discord通知の共通ヘルパー
 *
 * 全 update-*.ts スクリプトから利用される。
 *
 * 環境変数:
 *   DISCORD_WEBHOOK_URL  - 通知先 Webhook URL（未設定時は no-op）
 *   DISCORD_DRY_RUN=1    - POSTせずペイロードを stdout に出力（テスト用）
 */

export type NotificationStatus = "success" | "warning" | "error";

export interface NotifyField {
    name: string;
    value: string | number;
    inline?: boolean;
}

export interface NotifyParams {
    source: string;
    status: NotificationStatus;
    summary?: string;
    metrics?: NotifyField[];
    errors?: string[];
    alwaysSend?: boolean;
}

const COLOR_BY_STATUS: Record<NotificationStatus, number> = {
    success: 0x00c853,
    warning: 0xffaa00,
    error: 0xff0000,
};

const STATUS_LABEL: Record<NotificationStatus, string> = {
    success: "Success",
    warning: "Warning",
    error: "Error",
};

function buildEmbed(params: NotifyParams): Record<string, unknown> {
    const fields: NotifyField[] = [];

    for (const m of params.metrics ?? []) {
        fields.push({
            name: m.name,
            value: String(m.value),
            inline: m.inline ?? true,
        });
    }

    if (params.errors && params.errors.length > 0) {
        const combined = params.errors.join("\n").slice(0, 1000);
        fields.push({ name: "Errors", value: combined, inline: false });
    }

    const embed: Record<string, unknown> = {
        title: `${params.source}: ${STATUS_LABEL[params.status]}`,
        color: COLOR_BY_STATUS[params.status],
        timestamp: new Date().toISOString(),
    };

    if (params.summary) {
        embed.description = params.summary;
    }

    if (fields.length > 0) {
        embed.fields = fields;
    }

    return embed;
}

export async function notifyDiscord(params: NotifyParams): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const embed = buildEmbed(params);
    const payload = { embeds: [embed] };

    if (process.env.DISCORD_DRY_RUN === "1") {
        console.log("[DISCORD_DRY_RUN] Would POST:", JSON.stringify(payload, null, 2));
        return;
    }

    await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    }).catch((e: unknown) => console.error("Discord notification failed:", e));
}

/**
 * 「有意なときだけ通知」ポリシー:
 *   - status === "error" | "warning": 常に送信
 *   - status === "success" && newItems === 0: 送信しない (ノイズ抑制)
 *   - status === "success" && newItems > 0: 送信
 *   - errors配列に中身がある: 送信
 *   - alwaysSend === true: 送信
 */
export async function notifyIfNoteworthy(
    params: NotifyParams & { newItems: number }
): Promise<void> {
    const { newItems, ...rest } = params;
    const shouldSend =
        params.alwaysSend === true ||
        params.status === "error" ||
        params.status === "warning" ||
        newItems > 0 ||
        (params.errors && params.errors.length > 0);

    if (!shouldSend) {
        console.log(`[${params.source}] 0 new items, suppressing Discord notification`);
        return;
    }

    await notifyDiscord(rest);
}
