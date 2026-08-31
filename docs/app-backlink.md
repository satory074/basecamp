# 掲載アプリ共通: バックリンクバー正準仕様

satory074.com/apps に掲載する全アプリ（GitHub topic `featured-app` 付きリポジトリ）には、アプリ一覧へ戻る**固定バックリンクバー**を設置する。本ドキュメントが唯一の正準仕様。2026-08 に全 9 アプリ（todayai / wcup-tsuuka / tenji / uranai / odekaketenki / produce101japan-ranking / yaruo-dsp / m1-omoroi / hyakuichi）をこの仕様に統一済み。2026-09 に samesaengil を追加（計 10 アプリ）。

## なぜこの形か（ベストプラクティスの根拠）

- **固定ミニバー**: NN/g は「フッタを隠さない・折りたたまない」「無限スクロール等でフッタに到達できないページでは sticky なミニフッタを使う」を推奨。todayai のような長大フィードでも常に到達可能なように、通常フッタとは別の固定 36px バーにしている。
- **リンクは 1 つだけ・ラベル明確**: フッタのアンチパターン（リンク過多・曖昧ラベル・極小フォント）を避け、「satory074 のほかのアプリ ↗」1 リンク・12px・aria-label 付きに限定。
- **`rel="noopener"`（noreferrer なし）**: ハブ側（basecamp commit 70abca46）と同じ方針でリファラを通し、Cloudflare Web Analytics で流入を把握できるようにする。計測用クエリパラメータ（`?ref=` / utm）は**付けない**（CF 無料版ではクエリ集計が弱く実益薄。URL はクリーンに保つ）。

## 不変条件（全アプリ共通）

- `<nav>` に marker クラス **`app-backlink-bar`**（Tailwind アプリでもスタイル無関係に付与する。`grep -rl app-backlink-bar` で横断監査するため）
- `aria-label="サイト間ナビゲーション"`、`position: fixed` で画面下端、**z-index 40**
- **アプリ自身が固定ボトムナビを持つ場合はその真上に段積みする**（`bottom: calc(ナビ高 + env(safe-area-inset-bottom))`、z-index はナビの 1 段下）。バーを `bottom: 0` に置くと主要ナビと重なるため。safe-area は下のナビが既に吸収しているのでバー側では足さない（二重に取ると隙間が空く）。本文下部余白にはナビ高＋バー高の両方を予約する。**hyakuichi が該当**
- 背景 = アプリの SURFACE トークン **90% 透過** + **backdrop-blur 8px**、上辺 1px BORDER
- 内容行 **36px (h-9)** 中央寄せ、**内側 max-width なし**（1 リンク中央寄せに幅制約は不要）
- nav に `padding-bottom: env(safe-area-inset-bottom)`
- リンク: `href="https://satory074.com/apps/"` `target="_blank" rel="noopener"`
  `aria-label="satory074 のほかのアプリ一覧を新しいタブで開く"`
  テキスト `satory074 のほかのアプリ <span aria-hidden="true">↗</span>`、12px、MUTED 色 → hover で ACCENT 色
- **アンカーのヒット領域はバー全高**（Tailwind: `h-full px-3` / CSS: `padding: 8px 14px; margin: -8px 0`）。テキスト高のみの ~18px ターゲットにしない — WCAG 2.5.8 (24px) と Apple HIG 44pt に寄せる（詳細は末尾の評価節）
- **本文下部余白**: 最外ラッパ（body / ルート div）に `padding-bottom: calc(48px + env(safe-area-inset-bottom))`（Tailwind: `pb-[calc(48px+env(safe-area-inset-bottom))]`）。固定 `pb-12` 等は不可 — ノッチ付き iPhone でコンテンツがバーに隠れる
- **アンカージャンプ対策**: グローバル CSS に `html { scroll-padding-bottom: calc(48px + env(safe-area-inset-bottom)); }`。ページ内アンカー遷移時に固定バーが飛び先を隠すのを防ぐ（アンカーのないアプリでも一律で入れる）

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
       class="inline-flex h-full items-center gap-1 px-3 text-xs text-{MUTED} transition-colors hover:text-{ACCENT}">
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
  /* ヒット領域を WCAG 2.5.8 の 24px 以上に拡大（負マージンで見た目の高さは不変） */
  padding: 8px 14px;
  margin: -8px 0;
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
/* ページ内アンカー遷移時に固定バーが飛び先を隠さないように */
html {
  scroll-padding-bottom: calc(48px + env(safe-area-inset-bottom));
}
```

## 現行 10 アプリの実装場所と色トークン

| App | 変種 | 設置ファイル | SURFACE | BORDER | MUTED | ACCENT |
|---|---|---|---|---|---|---|
| todayai | Tailwind | `src/components/Layout.astro` | `[var(--color-bg)]` | `[var(--color-border)]` | `[var(--color-text-muted)]` | `[var(--color-accent)]`（`font-mono` 維持） |
| wcup-tsuuka | CSS | `src/pages/index.astro` + `src/styles/globals.css` | `var(--surface)` | `var(--border)` | `var(--ink-soft)` | `var(--link)` |
| tenji | Tailwind | `src/App.tsx` | `white` | `slate-200` | `slate-600` | `slate-900` |
| uranai | Tailwind | `src/components/Layout.tsx` | `paper` | `border-hairline` | `ink/70` | `plum` |
| odekaketenki | Tailwind | `app/layout.tsx` | `white` | `slate-200` | `slate-600` | `sky-700` |
| produce101japan-ranking | Tailwind (Play CDN) | `index.html` | `white` | `gray-200` | `gray-600` | `gray-900` |
| yaruo-dsp | CSS | `src/components/Layout.astro` + `src/styles/globals.css` | `var(--color-surface)` | `var(--color-rule)` | `var(--color-ink-soft)` | `var(--color-indigo)` |
| m1-omoroi | CSS | `web/src/App.tsx` + `web/src/index.css` | `var(--paper-2)` | `var(--line)` | ink 70% 混色（下記コントラスト節参照） | `var(--red)` |
| hyakuichi | CSS（段積み） | `index.html` + `src/style.css` | `var(--bg-secondary)` | `var(--border)` | `var(--text-secondary)` | `var(--gold)` |
| samesaengil | CSS | `src/components/Layout.astro` + `src/styles/globals.css` | `var(--surface)` | `var(--border)` | `var(--text-dim)` | `var(--accent-strong)` |

**段積み**: hyakuichi のみ自前の固定ボトムナビ（64px, z-index 100）があるため、バーは `bottom: 0` ではなくその真上（`bottom: calc(var(--nav-height) + var(--safe-bottom))`, z-index 90）に置く。

## 新アプリに追加するときのチェックリスト

1. 設置場所を決める: 共有レイアウト（Astro `Layout.astro` / React ルートコンポーネント / Next.js root `layout.tsx`）> 単一ページなら `index.astro` / `index.html` の `</body>` 直前
2. Tailwind 導入済みならスニペット A、なければスニペット B をコピーし、色トークン 4 つをアプリのパレットに置換
3. 最外ラッパの下部余白を `calc(48px + env(safe-area-inset-bottom))` にする（既存の固定 `pb-*` があれば置換）
4. ビルド + iPhone エミュレーションで確認: バーが最前面・最下部コンテンツが隠れない・hover 色が変わる
5. `featured-app` topic を付けて掲載（basecamp CLAUDE.md「Apps (作品カタログ)」参照）

## ベストプラクティス評価 (2026-08)

ウェブ調査（NN/g / Smashing Magazine / W3C WCAG 2.2 Understanding）に基づく批判的評価の結論。仕様を変えたくなったらまずここを読む:

- **固定バー形式は維持**: NN/g はフッタ到達不能ページ（無限フィード等）で sticky mini footer を推奨、Smashing の sticky ガイドライン（コンパクト・項目5以内）にも合致。36px はスマホ画面の ~4-5% で許容範囲。hide-on-scroll 化は 7 リポジトリ（素 HTML 含む）への JS 追加の複雑性に見合わないため不採用
- **`target="_blank"` は維持**: UX 論では同タブ派が優勢だが、(a) アプリ内状態（ドリル進行・入力中データ）を破壊しない、(b) ハブ→アプリ遷移も新タブで対称、(c) 同タブ要件の WCAG 3.2.5 は AAA。新タブ警告要件（視覚 ↗ + aria-label + rel=noopener）は充足済み
- **タッチターゲット**: 孤立リンクは spacing exception（24px 円が他ターゲットと交差しない）で WCAG 2.5.8 (AA) を形式上パスするが、standalone リンクに inline 例外は適用されないため、アンカーをバー全高（36px）に拡大して Apple HIG 44pt / Material 48dp に近づけた（2026-08 適用済み）
- **コントラスト**: 全 9 アプリの MUTED 実トークン値で 4.5:1 (AA) 以上を確認済み（uranai `ink/70` ≈ 5.5:1、wcup は light/dark 両方。m1-omoroi は `--muted` が paper-2 上 3.24:1 と未達だったため `color-mix(in srgb, var(--ink) 70%, var(--paper-2))` = 5.73:1 を採用。hyakuichi は `#a89b8c` on `#16213e` = 5.87:1、samesaengil は `--text-dim` `#6c757d` on `#ffffff` = 4.68:1）。トークンを変えるときは再確認すること
- **計測パラメータなし・12px・36px バー高**: 維持（12px はフッタ慣行として許容、コントラストで補償）

## 横断監査

```bash
# 10 アプリ全てで 1 ヒットずつ返ること
cd /Users/satory074/Basecamp/src
grep -rl --include="*.astro" --include="*.tsx" --include="*.html" "app-backlink-bar" \
  todayai wcup-tsuuka tenji uranai odekaketenki produce101japan-ranking yaruo-digital-shingou-shori \
  m1-omoroi/web/src hyakuichi/index.html samesaengil

# 本番確認（デプロイ後）
curl -sf "https://satory074.github.io/tenji/?cb=$RANDOM" | grep -c "app-backlink-bar"
# m1-omoroi は SPA のため静的 HTML にバーが出ない → JS バンドル側を確認
curl -sf "https://satory074.github.io/m1-omoroi/?cb=$RANDOM" | grep -oE 'assets/index-[^"]+\.js' | head -1 | \
  xargs -I{} curl -sf "https://satory074.github.io/m1-omoroi/{}" | grep -c "app-backlink-bar"
```
