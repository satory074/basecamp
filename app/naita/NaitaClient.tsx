"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { Post } from "../lib/types";
import PlatformDashboard from "../components/dashboard/PlatformDashboard";
import { RichFeedCard } from "../components/shared/RichFeedCard";

const POSTS_PER_PAGE = 20;

const MEDIA_TYPES = ["映画", "ドラマ", "アニメ", "本", "漫画", "その他"];
const SOURCE_PLATFORMS = ["Netflix", "TVer", "U-NEXT", "Amazon Prime", "本", "漫画", "その他"];

interface OGPMeta {
    title: string;
    image: string;
    description: string;
    siteName: string;
}

interface FormFields {
    title: string;
    sourcePlatform: string;
    mediaType: string;
    watchedAt: string;
    notes: string;
    thumbnailUrl: string;
    externalUrl: string;
}

function detectPlatform(url: string): string {
    try {
        const host = new URL(url).hostname;
        if (host.includes("netflix")) return "Netflix";
        if (host.includes("tver")) return "TVer";
        if (host.includes("amazon")) return "Amazon Prime";
        if (host.includes("unext") || host.includes("u-next")) return "U-NEXT";
    } catch {
        // invalid URL
    }
    return "その他";
}

async function fetchNaitaPosts(): Promise<Post[]> {
    try {
        const response = await fetch("/api/naita");
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.4rem 0.6rem",
    fontSize: "0.85rem",
    border: "1px solid var(--color-border)",
    borderRadius: 4,
    background: "var(--color-background)",
    color: "var(--color-text)",
    outline: "none",
};

const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.4rem 0.6rem",
    fontSize: "0.85rem",
    border: "1px solid var(--color-border)",
    borderRadius: 4,
    background: "var(--color-background)",
    color: "var(--color-text)",
    outline: "none",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8rem",
    color: "var(--color-text-secondary)",
    marginBottom: "0.25rem",
};

export default function NaitaClient() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
    const [selectedType, setSelectedType] = useState<string>("all");
    const [showForm, setShowForm] = useState(false);
    const [urlInput, setUrlInput] = useState("");
    const [fetchingMeta, setFetchingMeta] = useState(false);
    const [meta, setMeta] = useState<OGPMeta | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [formFields, setFormFields] = useState<FormFields>({
        title: "",
        sourcePlatform: SOURCE_PLATFORMS[0],
        mediaType: MEDIA_TYPES[0],
        watchedAt: new Date().toISOString().slice(0, 16),
        notes: "",
        thumbnailUrl: "",
        externalUrl: "",
    });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNaitaPosts().then((data) => {
            setPosts(data);
            setLoading(false);
        });
        const saved = localStorage.getItem("naita_secret");
        if (!saved) setShowPasswordModal(true);
    }, []);

    useEffect(() => {
        setVisibleCount(POSTS_PER_PAGE);
    }, [selectedType]);

    const filteredPosts = selectedType === "all"
        ? posts
        : posts.filter((p) => p.description === selectedType);

    const hasMore = visibleCount < filteredPosts.length;

    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + POSTS_PER_PAGE, filteredPosts.length));
                }
            },
            { rootMargin: "200px" }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, filteredPosts.length]);

    async function handleFetchMeta(url: string) {
        if (!url.trim()) return;
        setFetchingMeta(true);
        setMeta(null);
        try {
            const res = await fetch(`/api/naita/metadata?url=${encodeURIComponent(url.trim())}`);
            const data = (await res.json()) as OGPMeta;
            setMeta(data);
            const detectedPlatform = data.siteName || detectPlatform(url.trim());
            setFormFields((prev) => ({
                ...prev,
                title: data.title || prev.title,
                thumbnailUrl: data.image || prev.thumbnailUrl,
                externalUrl: url.trim(),
                sourcePlatform: detectedPlatform || prev.sourcePlatform,
            }));
        } catch {
            // ignore
        } finally {
            setFetchingMeta(false);
        }
    }

    function handleUrlPaste(e: React.ClipboardEvent<HTMLInputElement>) {
        const pasted = e.clipboardData.getData("text").trim();
        if (pasted.startsWith("http")) {
            setUrlInput(pasted);
            handleFetchMeta(pasted);
            e.preventDefault();
        }
    }

    function handleUrlBlur() {
        const val = urlInput.trim();
        if (val.startsWith("http") && !meta) {
            handleFetchMeta(val);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const secret = localStorage.getItem("naita_secret") ?? "";
        if (!secret) {
            setShowPasswordModal(true);
            return;
        }

        setSubmitting(true);
        setSubmitError(null);

        try {
            const res = await fetch("/api/naita", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    secret,
                    title: formFields.title,
                    sourcePlatform: formFields.sourcePlatform,
                    mediaType: formFields.mediaType,
                    watchedAt: formFields.watchedAt ? new Date(formFields.watchedAt).toISOString() : undefined,
                    notes: formFields.notes || undefined,
                    thumbnailUrl: formFields.thumbnailUrl || undefined,
                    externalUrl: formFields.externalUrl || undefined,
                }),
            });

            if (res.status === 401) {
                setSubmitError("パスワードが違います");
                localStorage.removeItem("naita_secret");
                setShowPasswordModal(true);
                return;
            }
            if (!res.ok) {
                setSubmitError("送信に失敗しました");
                return;
            }

            setShowForm(false);
            setUrlInput("");
            setMeta(null);
            setFormFields({
                title: "",
                sourcePlatform: SOURCE_PLATFORMS[0],
                mediaType: MEDIA_TYPES[0],
                watchedAt: new Date().toISOString().slice(0, 16),
                notes: "",
                thumbnailUrl: "",
                externalUrl: "",
            });

            const freshPosts = await fetchNaitaPosts();
            setPosts(freshPosts);
        } catch {
            setSubmitError("送信に失敗しました");
        } finally {
            setSubmitting(false);
        }
    }

    function handlePasswordSave() {
        if (!passwordInput.trim()) return;
        localStorage.setItem("naita_secret", passwordInput.trim());
        setPasswordInput("");
        setShowPasswordModal(false);
    }

    const typeCounts = MEDIA_TYPES.reduce<Record<string, number>>((acc, type) => {
        acc[type] = posts.filter((p) => p.description === type).length;
        return acc;
    }, {});

    const filterTabs = [
        { key: "all", label: "全て", count: posts.length },
        ...MEDIA_TYPES
            .map((t) => ({ key: t, label: t, count: typeCounts[t] || 0 }))
            .filter((t) => t.count > 0),
    ];

    const dashboardStats = [
        { label: "総件数", value: posts.length },
        ...MEDIA_TYPES
            .filter((t) => typeCounts[t] > 0)
            .map((t) => ({ label: t, value: typeCounts[t] })),
    ];

    return (
        <div className="space-y-4">
            {/* Password modal */}
            {showPasswordModal && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                }}>
                    <div style={{
                        background: "var(--color-background)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        padding: "1.5rem",
                        width: "90%",
                        maxWidth: 360,
                    }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-text)" }}>
                            パスワード設定
                        </h3>
                        <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
                            記録追加に使用するパスワードを入力してください。ブラウザに保存され、次回から自動的に使用されます。
                        </p>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handlePasswordSave()}
                            placeholder="パスワード"
                            autoFocus
                            style={{ ...inputStyle, marginBottom: "1rem" }}
                        />
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                style={{
                                    padding: "0.4rem 0.8rem",
                                    fontSize: "0.8rem",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: 4,
                                    background: "transparent",
                                    color: "var(--color-text-secondary)",
                                    cursor: "pointer",
                                }}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handlePasswordSave}
                                disabled={!passwordInput.trim()}
                                style={{
                                    padding: "0.4rem 0.8rem",
                                    fontSize: "0.8rem",
                                    border: "none",
                                    borderRadius: 4,
                                    background: "var(--color-naita)",
                                    color: "#fff",
                                    cursor: passwordInput.trim() ? "pointer" : "default",
                                    opacity: passwordInput.trim() ? 1 : 0.5,
                                }}
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!loading && (
                <PlatformDashboard platform="naita" stats={dashboardStats} />
            )}

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {filterTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setSelectedType(tab.key)}
                        style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.8rem",
                            fontWeight: selectedType === tab.key ? 600 : 400,
                            border: `1px solid ${selectedType === tab.key ? "var(--color-naita)" : "var(--color-border)"}`,
                            background: selectedType === tab.key ? "var(--color-naita)" : "transparent",
                            color: selectedType === tab.key ? "#fff" : "var(--color-text-secondary)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                        }}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Add record button */}
            <div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    style={{
                        padding: "0.4rem 1rem",
                        borderRadius: "9999px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        border: "1px solid var(--color-naita)",
                        background: showForm ? "var(--color-naita)" : "transparent",
                        color: showForm ? "#fff" : "var(--color-naita)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                    }}
                >
                    {showForm ? "✕ キャンセル" : "+ 記録を追加"}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: 4,
                    padding: "1rem",
                    background: "var(--color-background-muted)",
                    marginBottom: "1rem",
                }}>
                    {/* Header row: URL + key icon */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onPaste={handleUrlPaste}
                                onBlur={handleUrlBlur}
                                placeholder="URLを貼り付け（自動でOGP取得）"
                                style={{
                                    ...inputStyle,
                                    fontSize: "0.9rem",
                                    paddingRight: fetchingMeta ? "2rem" : "0.6rem",
                                }}
                            />
                            {fetchingMeta && (
                                <span
                                    className="loading-spinner"
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        right: "0.5rem",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                    }}
                                />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPasswordModal(true)}
                            title="パスワード設定"
                            style={{
                                padding: "0.4rem 0.5rem",
                                fontSize: "1rem",
                                border: "1px solid var(--color-border)",
                                borderRadius: 4,
                                background: "transparent",
                                cursor: "pointer",
                                lineHeight: 1,
                                flexShrink: 0,
                            }}
                        >
                            🔑
                        </button>
                    </div>

                    {/* Thumbnail preview */}
                    {meta?.image && (
                        <div style={{ marginBottom: "1rem" }}>
                            <Image
                                src={meta.image}
                                alt="thumbnail"
                                width={120}
                                height={80}
                                style={{ objectFit: "cover", borderRadius: 4 }}
                                unoptimized
                            />
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Title */}
                        <div style={{ marginBottom: "0.75rem" }}>
                            <label style={labelStyle}>タイトル *</label>
                            <input
                                type="text"
                                required
                                value={formFields.title}
                                onChange={(e) => setFormFields((p) => ({ ...p, title: e.target.value }))}
                                style={inputStyle}
                            />
                        </div>

                        {/* MediaType + SourcePlatform */}
                        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: 120 }}>
                                <label style={labelStyle}>種類 *</label>
                                <select
                                    required
                                    value={formFields.mediaType}
                                    onChange={(e) => setFormFields((p) => ({ ...p, mediaType: e.target.value }))}
                                    style={selectStyle}
                                >
                                    {MEDIA_TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ flex: 1, minWidth: 120 }}>
                                <label style={labelStyle}>プラットフォーム *</label>
                                <select
                                    required
                                    value={formFields.sourcePlatform}
                                    onChange={(e) => setFormFields((p) => ({ ...p, sourcePlatform: e.target.value }))}
                                    style={selectStyle}
                                >
                                    {SOURCE_PLATFORMS.map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: "0.75rem" }}>
                            <label style={labelStyle}>なぜ泣いたか（任意）</label>
                            <textarea
                                value={formFields.notes}
                                onChange={(e) => setFormFields((p) => ({ ...p, notes: e.target.value }))}
                                rows={2}
                                placeholder="感想など..."
                                style={{
                                    ...inputStyle,
                                    resize: "vertical",
                                }}
                            />
                        </div>

                        {submitError && (
                            <p style={{ fontSize: "0.8rem", color: "#e53e3e", marginBottom: "0.5rem" }}>
                                {submitError}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: "100%",
                                padding: "0.5rem 1.25rem",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                border: "none",
                                borderRadius: 4,
                                background: "var(--color-naita)",
                                color: "#fff",
                                cursor: submitting ? "wait" : "pointer",
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting ? "保存中…" : "保存"}
                        </button>
                    </form>
                </div>
            )}

            {loading && (
                <div className="load-more-sentinel">
                    <span className="loading-spinner" aria-hidden="true" />
                </div>
            )}

            {!loading && posts.length === 0 && (
                <p className="text-gray-500 text-sm">まだ記録がありません。</p>
            )}

            {filteredPosts.slice(0, visibleCount).map((post) => (
                <RichFeedCard key={post.id} post={post} platform="naita" />
            ))}

            {hasMore && (
                <div
                    ref={loadMoreRef}
                    className="load-more-sentinel"
                    role="status"
                    aria-live="polite"
                    aria-label="読み込み中..."
                >
                    <span className="loading-spinner" aria-hidden="true" />
                </div>
            )}
        </div>
    );
}
