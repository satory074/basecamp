/**
 * 全ページ共通の OG 画像 public/og.png (1200×630) を作る。
 *
 *   npx tsx scripts/generate-og-image.ts
 *
 * 文字は SVG で書いて sharp (librsvg) で PNG にする。和文フォントは実行環境のものを使うので、
 * 結果の PNG を commit する (CI では作らない)。ページごとの画像は作らない。
 * 色は globals.css のトークン (--fg / --fg-muted / --accent) と同じ値。
 * 写真は入れない (public/images/profile.png は本人の写真とは限らないポスター風の画像なので、本人を表す画像に使わない)。
 */
import sharp from "sharp";

const OUT = "public/og.png";
const W = 1200;
const H = 630;
const FONT = "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="${H - 16}" width="${W}" height="16" fill="#c32a5e"/>
  <text x="96" y="300" font-family="${FONT}" font-size="104" font-weight="800" fill="#16161a">satory074</text>
  <text x="100" y="384" font-family="${FONT}" font-size="44" font-weight="600" fill="#16161a">作ったアプリと毎日の記録</text>
  <text x="100" y="520" font-family="${FONT}" font-size="32" font-weight="500" fill="#5a5a66">satory074.com</text>
</svg>`;

async function main() {
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(OUT);
    console.log(`wrote ${OUT}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
