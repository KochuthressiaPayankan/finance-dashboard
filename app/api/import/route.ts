import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCsv } from "@/lib/sources/csv";
import { categorize } from "@/lib/categorize";

export async function POST(req: Request) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const { transactions, skipped } = parseCsv(await file.text());

    const [rules, categories] = await Promise.all([
        prisma.categoryRule.findMany(),
        prisma.category.findMany(),
    ]);
    rules.sort((a, b) => b.keyword.length - a.keyword.length); // longer keywords win
    const fallback = {
        income: categories.find((c) => c.name === "Income")?.id ?? null,
        other: categories.find((c) => c.name === "Other")?.id ?? null,
    };

    const result = await prisma.transaction.createMany({
        data: transactions.map((t) => ({
            ...t,
            categoryId: categorize(t.description, t.amount, rules, fallback),
            source: "csv",
        })),
        skipDuplicates: true,
    });

    return NextResponse.json({
        imported: result.count,
        duplicatesSkipped: transactions.length - result.count,
        invalidRows: skipped,
    });
}