import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient, createSupabaseServiceClient } from "@/app/lib/supabase";
import type { Post } from "@/app/lib/types";

export const dynamic = "force-dynamic";

interface NaitaRow {
    id: string;
    title: string;
    source_platform: string;
    media_type: string;
    watched_at: string;
    notes: string | null;
    thumbnail_url: string | null;
    external_url: string | null;
    created_at: string;
}

export async function GET() {
    try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
            .from("naita")
            .select("*")
            .order("watched_at", { ascending: false });

        if (error) {
            console.error("Supabase GET error:", error);
            return NextResponse.json([], { status: 200 });
        }

        const posts: Post[] = (data as NaitaRow[]).map((row) => ({
            id: row.id,
            title: row.title,
            url: row.external_url || "",
            date: row.watched_at,
            platform: "naita",
            description: row.media_type,
            thumbnail: row.thumbnail_url ?? undefined,
            category: row.source_platform,
            // naita-specific fields via data
            data: {
                sourcePlatform: row.source_platform,
                mediaType: row.media_type,
                notes: row.notes ?? undefined,
                watchedAt: row.watched_at,
            },
        }));

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Naita GET error:", error);
        return NextResponse.json([], { status: 200 });
    }
}

interface NaitaPostBody {
    secret?: string;
    title?: string;
    sourcePlatform?: string;
    mediaType?: string;
    watchedAt?: string;
    notes?: string;
    thumbnailUrl?: string;
    externalUrl?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as NaitaPostBody;

        if (!process.env.NAITA_SECRET || body.secret !== process.env.NAITA_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!body.title || !body.sourcePlatform || !body.mediaType) {
            return NextResponse.json({ error: "title, sourcePlatform, mediaType are required" }, { status: 400 });
        }

        const supabase = createSupabaseServiceClient();
        const { error } = await supabase.from("naita").insert({
            title: body.title,
            source_platform: body.sourcePlatform,
            media_type: body.mediaType,
            watched_at: body.watchedAt || new Date().toISOString(),
            notes: body.notes || null,
            thumbnail_url: body.thumbnailUrl || null,
            external_url: body.externalUrl || null,
        });

        if (error) {
            console.error("Supabase INSERT error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        console.error("Naita POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
