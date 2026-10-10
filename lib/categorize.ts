type Rule = { keyword: string; categoryId: number };

export function categorize(
    description: string,
    amount: number,
    rules: Rule[],
    fallback: { income: number | null; other: number | null }
): number | null {
    const d = description.toLowerCase();
    const hit = rules.find((r) => d.includes(r.keyword.toLowerCase()));
    if (hit) return hit.categoryId;
    return amount > 0 ? fallback.income : fallback.other;
}