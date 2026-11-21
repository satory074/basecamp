/** 固定の自己紹介 (2026-11-21 ユーザー確認済みの文。変えるときは本人に確認する) */
const PROFILE_SUMMARY = "satory074 です。百人一首や点字の学習アプリ、M-1 の記録サイトなど、小さな Web アプリを作って公開しています。";

/**
 * 本人とサイトの事実はここに 1 回だけ書く。ホームの見出し下・meta description・JSON-LD (Person / WebSite) が
 * 同じ文を読む (検索結果や AI が「satory074 とは」を答えるときの元になるので、場所ごとに食い違わせない)。
 * 毎週 AI が書く紹介文 (bio.json) は変わるので、ここには入れない。
 */
export const config = {
    siteUrl: "https://satory074.com",
    /** サイト名 = ハンドル名。旧名「Basecamp」は WebSite の alternateName に残す */
    siteName: "satory074",
    siteAlternateName: "Basecamp",
    /** ホームの <title> */
    siteTitle: "satory074 | 作ったアプリと毎日の記録",
    profileSummary: PROFILE_SUMMARY,
    /** ホームの meta description。自己紹介 + このサイトに何があるか */
    siteDescription: `${PROFILE_SUMMARY}このサイトでは、作ったアプリの一覧と、GitHub・記事・読書・映画・音楽・ゲームなどの記録を毎日自動でまとめています。`,
    /** ホームの役職の行と Person.jobTitle */
    role: "Creative Developer",
    location: "Tokyo, JP",
    avatarUrl: "https://github.com/satory074.png",
    /** 全ページ共通の OG 画像 (public/og.png、scripts/generate-og-image.ts で作る) */
    ogImage: "/og.png",
    profiles: {
        github: {
            username: "satory074",
            url: "https://github.com/satory074",
        },
        hatena: {
            username: "satory074",
            url: "https://satory074.hatenablog.com/",
        },
        soundcloud: {
            username: "satory074",
            url: "https://soundcloud.com/satory074",
        },
        zenn: {
            username: "satory074",
            url: "https://zenn.dev/satory074",
        },
        booklog: {
            username: "satory074",
            url: "https://booklog.jp/users/satory074",
        },
        tenhou: {
            username: "Unbobo",
            url: "https://tenhou.net/",
        },
        ff14: {
            characterName: "Satory Nocturne",
            server: "Zeromus",
            characterId: "27095571",
            lodestoneUrl: "https://jp.finalfantasyxiv.com/lodestone/character/27095571/",
        },
        note: {
            username: "satory074",
            url: "https://note.com/satory074",
        },
        filmarks: {
            username: "satory074",
            url: "https://filmarks.com/users/satory074",
        },
        spotify: {
            username: "satory074",
            url: "https://open.spotify.com/user/satory074",
        },
        hatenabookmark: {
            username: "satory074",
            url: "https://b.hatena.ne.jp/satory074",
        },
        x: {
            username: "satory074",
            url: "https://x.com/satory074",
        },
        duolingo: {
            username: "satory074",
            url: "https://www.duolingo.com/profile/satory074",
        },
        steam: {
            username: "satory074",
            url: "https://steamcommunity.com/profiles/76561198356948508",
        },
        playstation: {
            // PSN Online ID。公式の公開プロフィール (profile.playstation.com) に飛ばす
            username: "satory_074",
            url: "https://profile.playstation.com/satory_074",
        },
        swarm: {
            username: "satory074",
            url: "https://www.swarmapp.com/satory074",
        },
    },
};
