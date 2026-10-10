import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const month =
        new URL(req.url).searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
    const [y, m] = month.split("-").map(Number);
    const gte = new Date(Date.UTC(y, m - 1, 1));
    const lt = new Date(Date.UTC(y, m, 1));

    const [transactions, categories] = await Promise.all([
        prisma.transaction.findMany({
            where: { date: { gte, lt } },
            orderBy: { date: "desc" },
        }),
        prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({
        categories,
        transactions: transactions.map((t) => ({
            id: t.id,
            date: t.date.toISOString().slice(0, 10),
            description: t.description,
            merchant: t.merchant,
            amount: Number(t.amount),
            categoryId: t.categoryId,
        })),
    });
}