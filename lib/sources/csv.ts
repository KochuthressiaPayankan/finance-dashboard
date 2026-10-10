import Papa from "papaparse";
import { createHash } from "crypto";

export type NormalizedTransaction = {
    date: Date;
    amount: number; // negative = expense
    merchant: string;
    description: string;
    hash: string;
};

function parseDate(raw: string): Date | null {
    const s = raw.trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])); // DD/MM/YYYY
    return null;
}

function parseAmount(raw?: string): number {
    if (!raw) return 0;
    const n = parseFloat(raw.replace(/[₹,\s]/g, ""));
    return Number.isNaN(n) ? 0 : n;
}

function guessMerchant(description: string): string {
    const words = description.replace(/[^a-zA-Z ]/g, " ").split(/\s+/).filter(Boolean);
    return words.slice(0, 2).join(" ") || description;
}

export function parseCsv(text: string) {
    const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
    });

    const transactions: NormalizedTransaction[] = [];
    const seen = new Map<string, number>();
    let skipped = 0;

    for (const row of parsed.data) {
        const date = parseDate(row["date"] ?? row["txn date"] ?? "");
        const description = (row["description"] ?? row["narration"] ?? row["details"] ?? "").trim();
        const amount =
            row["amount"] !== undefined
                ? parseAmount(row["amount"])
                : parseAmount(row["credit"]) - parseAmount(row["debit"]);

        if (!date || !description || amount === 0) {
            skipped++;
            continue;
        }

        // the occurrence counter keeps two identical purchases on the same day (e.g. 2 coffees)
        const key = `${date.toISOString().slice(0, 10)}|${amount}|${description.toLowerCase()}`;
        const n = (seen.get(key) ?? 0) + 1;
        seen.set(key, n);
        const hash = createHash("sha256").update(`${key}|${n}`).digest("hex");

        transactions.push({ date, amount, merchant: guessMerchant(description), description, hash });
    }

    return { transactions, skipped };
}