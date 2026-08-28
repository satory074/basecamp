import Link from "next/link";

interface MonthNavProps {
    months: string[];
    /** 現在表示中の月 ("08")。トップページでは undefined */
    current?: string;
}

export default function MonthNav({ months, current }: MonthNavProps) {
    if (months.length === 0) return null;

    return (
        <nav aria-label="月別の試合結果">
            <ul className="npb-month-nav">
                {months.map((month) => (
                    <li key={month}>
                        <Link
                            href={`/baseball/${month}`}
                            className="npb-month-link"
                            aria-current={month === current ? "page" : undefined}
                        >
                            {Number(month)}月
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
