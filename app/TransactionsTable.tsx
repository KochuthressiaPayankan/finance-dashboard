"use client";

import { useEffect, useState } from "react";

type Tx = {
    id: number;
    date: string;
    description: string;
    merchant: string;
    amount: number;
    categoryId: number | null;
};
type Cat = { id: number; name: string };

const inr = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function TransactionsTable({
    month,
    version,
    onChanged,
}: {
    month: string;
    version: number;
    onChanged: () => void;
}) {
    const [txs, setTxs] = useState<Tx[]>([]);
    const [cats, setCats] = useState<Cat[]>([]);
    const [note, setNote] = useState("");

    useEffect(() => {
        fetch(`/api/transactions?month=${month}`)
            .then((r) => r.json())
            .then((d) => {
                setTxs(d.transactions);
                setCats(d.categories);
            });
    }, [month, version]);

    async function recategorize(id: number, categoryId: number) {
        const res = await fetch(`/api/transactions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoryId }),
        });
        const r = await res.json();
        setNote(r.alsoUpdated ? `Saved. Also updated ${r.alsoUpdated} similar transaction(s).` : "Saved.");
        onChanged();
    }

    return (
        <section className="space-y-2">
            <h2 className="text-lg font-semibold">Transactions</h2>
            {note && <p className="text-sm text-gray-500">{note}</p>}
            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="text-left text-gray-500">
                        <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Description</th>
                            <th className="p-2 text-right">Amount</th>
                            <th className="p-2">Category</th>
                        </tr>
                    </thead>
                    <tbody>
                        {txs.map((t) => (
                            <tr key={t.id} className="border-t">
                                <td className="p-2 whitespace-nowrap">{t.date}</td>
                                <td className="p-2">{t.description}</td>
                                <td className={`p-2 text-right ${t.amount < 0 ? "" : "text-green-500"}`}>
                                    {inr(t.amount)}
                                </td>
                                <td className="p-2">
                                    <select
                                        value={t.categoryId ?? ""}
                                        onChange={(e) => recategorize(t.id, Number(e.target.value))}
                                        className="rounded border px-1 py-0.5 text-black"
                                    >
                                        {t.categoryId === null && <option value="">Uncategorized</option>}
                                        {cats.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                        {txs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-4 text-center text-gray-500">
                                    No transactions this month.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}