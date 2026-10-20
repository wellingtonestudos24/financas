import Link from "next/link";
import { Suspense } from "react";
import { ArrowDown, ArrowUp, Landmark, Plus, Scale } from "lucide-react";
import { CategoryChart } from "@/components/category-chart";
import { MonthNav } from "@/components/month-nav";
import { SummaryCard, SummarySkeleton } from "@/components/summary-card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDay, monthRange, parseMonth } from "@/lib/dates";
import { accountsOverview, monthSummary, totalsByCategory } from "@/lib/finance";
import { formatCents } from "@/lib/money";

export const metadata = { title: "Início — Finanças" };

export default function DashboardPage({ searchParams }: PageProps<"/">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Visão geral</h1>
        <div className="flex gap-2">
          <Link href="/transacoes/nova?tipo=INCOME" className="btn-ghost bg-white text-green-700">
            <Plus className="size-4" /> Receita
          </Link>
          <Link href="/transacoes/nova?tipo=EXPENSE" className="btn-primary">
            <Plus className="size-4" /> Despesa
          </Link>
        </div>
      </div>
      <Suspense fallback={<SummarySkeleton />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const params = await searchParams;
  const user = await requireUser();
  const month = parseMonth(params.mes);
  const { start, end } = monthRange(month);

  const [overview, summary, expenses, incomes, pending] = await Promise.all([
    accountsOverview(user.id, month),
    monthSummary(user.id, month),
    totalsByCategory(user.id, month, "EXPENSE"),
    totalsByCategory(user.id, month, "INCOME"),
    db.transaction.findMany({
      where: { userId: user.id, paid: false, date: { gte: start, lt: end }, type: { not: "TRANSFER" } },
      include: { account: true },
      orderBy: { date: "asc" },
      take: 6,
    }),
  ]);

  return (
    <>
      <MonthNav month={month} basePath="/" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Saldo atual" cents={overview.totalCurrent} icon={Landmark} tone="blue" />
        <SummaryCard label="Receitas do mês" cents={summary.income} icon={ArrowUp} tone="green" />
        <SummaryCard label="Despesas do mês" cents={summary.expense} icon={ArrowDown} tone="red" />
        <SummaryCard label="Balanço do mês" cents={summary.balance} icon={Scale} tone="teal" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card flex flex-col gap-4">
          <h2 className="font-semibold">Despesas por categoria</h2>
          {expenses.length ? (
            <CategoryChart data={expenses} />
          ) : (
            <p className="py-10 text-center text-slate-500">Nenhuma despesa neste mês.</p>
          )}
        </section>

        <section className="card flex flex-col gap-4">
          <h2 className="font-semibold">Receitas por categoria</h2>
          {incomes.length ? (
            <CategoryChart data={incomes} />
          ) : (
            <p className="py-10 text-center text-slate-500">Nenhuma receita neste mês.</p>
          )}
        </section>

        <section className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Contas</h2>
            <Link href="/contas" className="text-sm font-medium text-teal-700 hover:underline">
              Ver todas
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {overview.accounts.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2">
                <span className="size-3 rounded-full" style={{ background: a.color }} />
                <span className="flex-1">{a.name}</span>
                <span className={`font-medium ${a.currentBalance < 0 ? "text-red-600" : ""}`}>
                  {formatCents(a.currentBalance)}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between border-t border-slate-100 pt-3 text-sm text-slate-500">
            Previsto no fim do mês <span className="font-semibold text-slate-800">{formatCents(overview.totalPredicted)}</span>
          </p>
        </section>

        <section className="card flex flex-col gap-3">
          <h2 className="font-semibold">Pendentes do mês</h2>
          {pending.length ? (
            <ul className="divide-y divide-slate-100">
              {pending.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2">
                  <span className="w-12 text-sm text-slate-500">{formatDay(t.date)}</span>
                  <Link href={`/transacoes/${t.id}`} className="flex-1 truncate hover:underline">
                    {t.description}
                  </Link>
                  <span className={`font-medium ${t.type === "INCOME" ? "text-green-700" : "text-red-600"}`}>
                    {formatCents(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-slate-500">Nada pendente neste mês.</p>
          )}
        </section>
      </div>
    </>
  );
}
