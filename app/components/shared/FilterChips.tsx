"use client";

export interface FilterOption {
    key: string;
    label: string;
    count?: number;
}

interface FilterChipsProps {
    /** グループ全体の名前 (読み上げ用。例: 「読書の状態で絞り込む」) */
    label: string;
    options: FilterOption[];
    selected: readonly string[];
    onToggle: (key: string) => void;
}

/**
 * 絞り込みボタンの並び。X・ブクログ・作品・PlayStation のライブラリで共用する
 * (以前は 4 か所で別々に書かれ、押されている状態が読み上げで分からなかった)。
 *
 * 押されている状態は aria-pressed で伝え、見た目は塗りつぶし + ✓ で示す (色だけにしない)。
 */
export default function FilterChips({ label, options, selected, onToggle }: FilterChipsProps) {
    return (
        <div className="chips" role="group" aria-label={label}>
            {options.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    className="chip"
                    aria-pressed={selected.includes(o.key)}
                    onClick={() => onToggle(o.key)}
                >
                    {o.label}
                    {o.count !== undefined && <span className="chip-count">{o.count.toLocaleString("ja-JP")}</span>}
                </button>
            ))}
        </div>
    );
}
