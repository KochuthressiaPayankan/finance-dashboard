"use client";
import TransactionsTable from "./TransactionsTable";
import { useCallback, useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Summary = {
  month: string;
  total: number;
  categories: { name: string; color: string; total: number }[];
};

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function Home() {
  const [month, setMonth] = useState("2026-09");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/summary?month=${month}`);
    setSummary(await res.json());
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body });
    const r = await res.json();
    setMessage(
      res.ok
        ? `Imported ${r.imported}, skipped ${r.duplicatesSkipped} duplicates, ${r.invalidRows} invalid rows`
        : r.error
    );
    e.target.value = "";
    load();
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Personal Finance Dashboard</h1>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          Month
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded border px-2 py-1 text-black"
          />
        </label>
        <label className="cursor-pointer rounded bg-blue-600 px-3 py-1.5 text-sm text-white">
          Upload CSV
          <input type="file" accept=".csv" onChange={upload} className="hidden" />
        </label>
      </div>
      {message && <p className="text-sm text-gray-500">{message}</p>}

      <section className="rounded-lg border p-4">
        <p className="text-sm text-gray-500">Total spent in {month}</p>
        <p className="text-3xl font-semibold">{inr(summary?.total ?? 0)}</p>
      </section>

      {summary && summary.categories.length > 0 ? (
        <section className="grid items-center gap-6 md:grid-cols-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.categories} dataKey="total" nameKey="name" innerRadius={60} outerRadius={110}>
                  {summary.categories.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => inr(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2">
            {summary.categories.map((c) => (
              <li key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span>{inr(c.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-gray-500">No expenses for this month. Upload a CSV or pick another month.</p>
      )}
    </main>
  );
}