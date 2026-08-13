# 掲載アプリ共通: バックリンクバー正準仕様

satory074.com/apps に掲載する全アプリ（GitHub topic `featured-app` 付きリポジトリ）には、アプリ一覧へ戻る**固定バックリンクバー**を設置する。本ドキュメントが唯一の正準仕様。2026-08 に全 7 アプリ（todayai / wcup-tsuuka / tenji / uranai / odekaketenki / produce101japan-ranking / yaruo-dsp）をこの仕様に統一済み。

## なぜこの形か（ベストプラクティスの根拠）

- **固定ミニバー**: NN/g は「フッタを隠さない・折りたたまない」「無限スクロール等でフッタに到達できないページでは sticky なミニフッタを使う」を推奨。todayai のような長大フィードでも常に到達可能なように、通常フッタとは別の固定 36px バーにしている。
- **リンクは 1 つだけ・ラベル明確**: フッタのアンチパターン（リンク過多・曖昧ラベル・極小フォント）を避け、「satory074 のほかのアプリ ↗」1 リンク・12px・aria-label 付きに限定。
- **`rel="noopener"`（noreferrer なし）**: ハブ側（basecamp commit 70abca46）と同じ方針でリファラを通し、Cloudflare Web Analytics で流入を把握できるようにする。計測用クエリパラメータ（`?ref=` / utm）は**付けない**（CF 無料版ではクエリ集計が弱く実益薄。URL はクリーンに保つ）。

## 不変条件（全アプリ共通）

- `<nav>` に marker クラス **`app-backlink-bar`**（Tailwind アプリでもスタイル無関係に付与する。`grep -rl app-backlink-bar` で横断監査するため）
- `aria-label="サイト間ナビゲーション"`、`position: fixed` で画面下端、**z-index 40**
- 背景 = アプリの SURFACE トークン **90% 透過** + **backdrop-blur 8px**、上辺 1px BORDER
- 内容行 **36px (h-9)** 中央寄せ、**内側 max-width なし**（1 リンク中央寄せに幅制約は不要）
- nav に `padding-bottom: env(safe-area-inset-bottom)`
- リンク: `href="https://satory074.com/apps/"` `target="_blank" rel="noopener"`
  `aria-label="satory074 のほかのアプリ一覧を新しいタブで開く"`
  テキスト `satory074 のほかのアプリ <span aria-hidden="true">↗</span>`、12px、MUTED 色 → hover で ACCENT 色
- **本文下部余白**: 最外ラッパ（body / ルート div）に `padding-bottom: calc(48px + env(safe-area-inset-bottom))`（Tailwind: `pb-[calc(48px+env(safe-area-inset-bottom))]`）。固定 `pb-12` 等は不可 — ノッチ付き iPhone でコンテンツがバーに隠れる

色は**アプリ固有のトークンを使う**（バーが各アプリのデザイン言語に馴染む + アプリがダークモード対応ならバーも自動追従する）。構造・挙動だけを統一する。

## スニペット A: Tailwind 変種

`{SURFACE}` / `{BORDER}` / `{MUTED}` / `{ACCENT}` をアプリのトークンに置換:

```html
<!-- サイト間ナビ: 画面下端に常駐する控えめな逆リンクバー（→ satory074.com/apps）。
     正準仕様: basecamp/docs/app-backlink.md -->
<nav class="app-backlink-bar fixed inset-x-0 bottom-0 z-40 border-t border-{BORDER} bg-{SURFACE}/90 backdrop-blur"
     aria-label="サイト間ナビゲーション" style="padding-bottom: env(safe-area-inset-bottom)">
  <div class="mx-auto flex h-9 items-center justify-center px-4">
    <a href="https://satory074.com/apps/" target="_blank" rel="noopener"
       aria-label="satory074 のほかのアプリ一覧を新しいタブで開く"
       class="inline-flex items-center gap-1 text-xs text-{MUTED} transition-colors hover:text-{ACCENT}">
      satory074 のほかのアプリ <span aria-hidden="true">↗</span>
    </a>
  </div>
</nav>
```

React (JSX) では `class` → `className`、`style` → `style={{ paddingBottom: "env(safe-area-inset-bottom)" }}`。

## スニペット B: 素 CSS 変種（Tailwind 非導入アプリ用）

マークアップ:

```html
<nav class="app-backlink-bar" aria-label="サイト間ナビゲーション">
  <a href="https://satory074.com/apps/" target="_blank" rel="noopener"
     aria-label="satory074 のほかのアプリ一覧を新しいタブで開く"
     >satory074 のほかのアプリ <span aria-hidden="true">↗</span></a>
</nav>
```

CSS（`--surface` / `--border` / `--muted` / `--accent` をアプリのトークンに置換）:

```css
/* サイト間ナビ: 画面下端に常駐する控えめな逆リンクバー（→ satory074.com/apps）。
   正準仕様: basecamp/docs/app-backlink.md。本文を隠さない（body 側に高さ分の padding を予約） */
.app-backlink-bar {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 6px 12px;
  padding-bottom: calc(6px + env(safe-area-inset-bottom));
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--border);
  font-size: 12px;
}
.app-backlink-bar a {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.12s ease;
}
.app-backlink-bar a:hover {
  color: var(--accent);
}
body {
  padding-bottom: calc(48px + env(safe-area-inset-bottom));
}
```

## 現行 7 アプリの実装場所と色トークン

| App | 変種 | 設置ファイル | SURFACE | BORDER | MUTED | ACCENT |
|---|---|---|---|---|---|---|
| todayai | Tailwind | `src/components/Layout.astro` | `[var(--color-bg)]` | `[var(--color-border)]` | `[var(--color-text-muted)]` | `[var(--color-accent)]`（`font-mono` 維持） |
| wcup-tsuuka | CSS | `src/pages/index.astro` + `src/styles/globals.css` | `var(--surface)` | `var(--border)` | `var(--ink-soft)` | `var(--link)` |
| tenji | Tailwind | `src/App.tsx` | `white` | `slate-200` | `slate-600` | `slate-900` |
| uranai | Tailwind | `src/components/Layout.tsx` | `paper` | `border-hairline` | `ink/70` | `plum` |
| odekaketenki | Tailwind | `app/layout.tsx` | `white` | `slate-200` | `slate-600` | `sky-700` |
| produce101japan-ranking | Tailwind (Play CDN) | `index.html` | `white` | `gray-200` | `gray-600` | `gray-900` |
| yaruo-dsp | CSS | `src/components/Layout.astro` + `src/styles/globals.css` | `var(--color-surface)` | `var(--color-rule)` | `var(--color-ink-soft)` | `var(--color-indigo)` |

## 新アプリに追加するときのチェックリスト

1. 設置場所を決める: 共有レイアウト（Astro `Layout.astro` / React ルートコンポーネント / Next.js root `layout.tsx`）> 単一ページなら `index.astro` / `index.html` の `</body>` 直前
2. Tailwind 導入済みならスニペット A、なければスニペット B をコピーし、色トークン 4 つをアプリのパレットに置換
3. 最外ラッパの下部余白を `calc(48px + env(safe-area-inset-bottom))` にする（既存の固定 `pb-*` があれば置換）
4. ビルド + iPhone エミュレーションで確認: バーが最前面・最下部コンテンツが隠れない・hover 色が変わる
5. `featured-app` topic を付けて掲載（basecamp CLAUDE.md「Apps (作品カタログ)」参照）

## 横断監査

```bash
# 7 アプリ全てで 1 ヒットずつ返ること
cd /Users/satory074/Basecamp/src
grep -rl --include="*.astro" --include="*.tsx" --include="*.html" "app-backlink-bar" \
  todayai wcup-tsuuka tenji uranai odekaketenki produce101japan-ranking yaruo-digital-shingou-shori

# 本番確認（デプロイ後）
curl -sf "https://satory074.github.io/tenji/?cb=$RANDOM" | grep -c "app-backlink-bar"
```
