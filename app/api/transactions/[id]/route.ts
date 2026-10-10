import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { categoryId } = await req.json();

    const tx = await prisma.transaction.update({
        where: { id: Number(id) },
        data: { categoryId },
    });

    // learn a rule from this correction
    const keyword = tx.merchant.trim().toLowerCase();
    let alsoUpdated = 0;

    if (keyword.length >= 3) {
        const existing = await prisma.categoryRule.findFirst({ where: { keyword } });
        if (!existing) {
            await prisma.categoryRule.create({ data: { keyword, categoryId } });
        } else if (existing.categoryId !== categoryId) {
            await prisma.categoryRule.update({ where: { id: existing.id }, data: { categoryId } });
        }

        // apply it to other transactions that are still uncategorized or in "Other"
        const other = await prisma.category.findUnique({ where: { name: "Other" } });
        const res = await prisma.transaction.updateMany({
            where: {
                id: { not: tx.id },
                description: { contains: keyword, mode: "insensitive" },
                OR: [{ categoryId: null }, { categoryId: other?.id }],
            },
            data: { categoryId },
        });
        alsoUpdated = res.count;
    }

    return NextResponse.json({ ok: true, alsoUpdated });
}