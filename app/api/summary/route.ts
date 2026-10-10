import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const month =
        new URL(req.url).searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
    const [y, m] = month.split("-").map(Number);
    const gte = new Date(Date.UTC(y, m - 1, 1));
    const lt = new Date(Date.UTC(y, m, 1));

    const grouped = await prisma.transaction.groupBy({
        by: ["categoryId"],
        _sum: { amount: true },
        where: { date: { gte, lt }, amount: { lt: 0 } },
    });
    const cats = await prisma.category.findMany();

    const categories = grouped
        .map((g) => {
            const c = cats.find((c) => c.id === g.categoryId);
            return {
                name: c?.name ?? "Uncategorized",
                color: c?.color ?? "#888888",
                total: Math.abs(Number(g._sum.amount ?? 0)),
            };
        })
        .sort((a, b) => b.total - a.total);

    return NextResponse.json({
        month,
        total: categories.reduce((s, c) => s + c.total, 0),
        categories,
    });
}