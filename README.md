# Personal Finance Dashboard

Upload bank statements (CSV), auto-categorize expenses, and see where your money goes each month.

## Features
- CSV import with duplicate protection (re-uploading the same statement won't double-count)
- Rule-based auto-categorization
- Recategorize any transaction from a dropdown; the app learns a rule from your correction and applies it to similar transactions
- Monthly spending donut chart and category breakdown

## Tech stack
Next.js, TypeScript, Tailwind CSS, Prisma 7, PostgreSQL, Recharts

## Setup
```bash
git clone https://github.com/YOUR_USERNAME/finance-dashboard.git
cd finance-dashboard
npm install
cp .env.example .env        # then edit DATABASE_URL
createdb finance
npx prisma migrate dev
npx prisma generate
npx tsx prisma/seed.ts
npm run dev
```
Open the printed localhost URL and upload `sample-data/transactions.csv`.

## CSV format
Columns: `date, description, amount` (negative = expense). Also accepts `debit`/`credit` columns and dates as `YYYY-MM-DD` or `DD/MM/YYYY`.

## Roadmap
- Monthly trend chart
- Plaid sandbox integration
- Budgets and recurring-subscription detection
