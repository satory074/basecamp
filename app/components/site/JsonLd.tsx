import { serializeJsonLd } from "@/app/lib/jsonld";

/** 構造化データを 1 ブロック出す (Server Component から使う) */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
