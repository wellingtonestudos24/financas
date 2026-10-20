import Link from "next/link";
import { Suspense } from "react";
import { CalendarClock, Landmark, Pencil, Plus } from "lucide-react";
import { MonthNav } from "@/components/month-nav";
import { SummaryCard } from "@/components/summary-card";
import { requireUser } from "@/lib/auth";
import { parseMonth } from "@/lib/dates";
import { accountsOverview } from "@/lib/finance";
import { ACCOUNT_TYPES } from "@/lib/labels";
import { formatCents } from "@/lib/money";

export const metadata = { title: "Contas — Finanças" };

export default function AccountsPage({ searchParams }: PageProps<"/contas">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Contas</h1>
        <Link href="/contas/nova" className="btn-primary">
          <Plus className="size-4" /> Nova conta
        </Link>
      </div>
      <Suspense fallback={<div className="card h-40 animate-pulse" />}>
        <Accounts searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Accounts({ searchParams }: { searchParams: PageProps<"/contas">["searchParams"] }) {
  const params = await searchParams;
  const user = await requireUser();
  const month = parseMonth(params.mes);
  const { accounts, totalCurrent, totalPredicted } = await accountsOverview(user.id, month);

  return (
    <>
      <MonthNav month={month} basePath="/contas" />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <article key={account.id} className="card flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-full text-white"
                  style={{ background: account.color }}
                >
                  <Landmark className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">{account.name}</h2>
                  <p className="text-xs text-slate-500">{ACCOUNT_TYPES[account.type]}</p>
                </div>
                <Link href={`/contas/${account.id}`} className="btn-ghost p-2" title="Editar">
                  <Pencil className="size-4" />
                </Link>
              </div>
              <dl className="grid gap-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Saldo atual</dt>
                  <dd className={`font-semibold ${account.currentBalance < 0 ? "text-red-600" : "text-green-700"}`}>
                    {formatCents(account.currentBalance)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Previsto no fim do mês</dt>
                  <dd className={`font-semibold ${account.predictedBalance < 0 ? "text-red-600" : "text-slate-700"}`}>
                    {formatCents(account.predictedBalance)}
                  </dd>
                </div>
              </dl>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 text-sm">
                <Link href={`/transacoes/nova?tipo=INCOME&conta=${account.id}`} className="font-medium text-green-700 hover:underline">
                  + Receita
                </Link>
                <Link href={`/transacoes/nova?tipo=EXPENSE&conta=${account.id}`} className="font-medium text-red-600 hover:underline">
                  + Despesa
                </Link>
              </div>
            </article>
          ))}
          {accounts.length === 0 && (
            <p className="card text-slate-500">Nenhuma conta ainda. Crie a primeira para começar.</p>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <SummaryCard label="Saldo atual" cents={totalCurrent} icon={Landmark} tone="blue" />
          <SummaryCard label="Saldo previsto" cents={totalPredicted} icon={CalendarClock} tone="teal" />
        </div>
      </div>
    </>
  );
}
