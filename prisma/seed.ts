import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const data: Record<string, { color: string; keywords: string[] }> = {
    Food: { color: "#f97316", keywords: ["swiggy", "zomato", "restaurant", "cafe", "bigbasket"] },
    Transport: { color: "#3b82f6", keywords: ["uber", "ola", "metro", "fuel", "petrol"] },
    Shopping: { color: "#a855f7", keywords: ["amazon", "flipkart", "myntra"] },
    Bills: { color: "#ef4444", keywords: ["electricity", "recharge", "jio", "airtel", "rent"] },
    Entertainment: { color: "#eab308", keywords: ["netflix", "spotify", "bookmyshow"] },
    Income: { color: "#22c55e", keywords: ["salary", "stipend", "credit interest"] },
    Other: { color: "#888888", keywords: [] },
};

async function main() {
    for (const [name, { color, keywords }] of Object.entries(data)) {
        const cat = await prisma.category.upsert({
            where: { name },
            update: { color },
            create: { name, color },
        });
        for (const keyword of keywords) {
            const exists = await prisma.categoryRule.findFirst({ where: { keyword, categoryId: cat.id } });
            if (!exists) await prisma.categoryRule.create({ data: { keyword, categoryId: cat.id } });
        }
    }
}

main().finally(() => prisma.$disconnect());