/**
 * PSN の playDuration (ISO 8601 duration) を秒に変換する。
 *
 * 例: "PT1984H47S" → 7142447, "PT13H33M" → 48780, "P1DT2H" → 93600
 * パースできない値は 0 を返す (プレイ時間の差分が負にならないよう呼び出し側で扱う)。
 */
export function parseIsoDuration(value: string | undefined | null): number {
    if (!value) return 0;
    const m = value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/);
    if (!m) return 0;
    const [, d, h, min, s] = m;
    return (
        Number(d ?? 0) * 86400 +
        Number(h ?? 0) * 3600 +
        Number(min ?? 0) * 60 +
        Math.floor(Number(s ?? 0))
    );
}
