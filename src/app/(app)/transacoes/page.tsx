import Link from "next/link";
import { Suspense } from "react";
import { ArrowDown, ArrowUp, Check, Clock, Landmark, Pencil, Plus, Scale, Trash2 } from "lucide-react";
import { MonthNav } from "@/components/month-nav";
import { SummaryCard, SummarySkeleton } from "@/components/summary-card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDay, monthKey, monthRange, parseMonth } from "@/lib/dates";
import { accountsOverview, monthSummary } from "@/lib/finance";
import { isTransactionType, TRANSACTION_TYPES } from "@/lib/labels";
import { formatCents } from "@/lib/money";
import { deleteTransaction, togglePaid } from "../actions";

export const metadata = { title: "Transações — Finanças" };

export default function TransactionsPage({ searchParams }: PageProps<"/transacoes">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Transações</h1>
        <Link href="/transacoes/nova" className="btn-primary">
          <Plus className="size-4" /> Nova transação
        </Link>
      </div>
      <Suspense fallback={<SummarySkeleton />}>
        <Transactions searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const FILTERS = [{ key: "", label: "Todas" }, ...Object.entries(TRANSACTION_TYPES).map(([key, label]) => ({ key, label }))];

async function Transactions({ searchParams }: { searchParams: PageProps<"/transacoes">["searchParams"] }) {
  const params = await searchParams;
  const user = await requireUser();
  const month = parseMonth(params.mes);
  const type = isTransactionType(params.tipo) ? params.tipo : undefined;
  const { start, end } = monthRange(month);

  const [overview, summary, transactions] = await Promise.all([
    accountsOverview(user.id, month),
    monthSummary(user.id, month),
    db.transaction.findMany({
      where: { userId: user.id, date: { gte: start, lt: end }, ...(type ? { type } : {}) },
      include: { account: true, toAccount: true, category: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Saldo atual" cents={overview.totalCurrent} icon={Landmark} tone="blue" />
        <SummaryCard label="Receitas" cents={summary.income} icon={ArrowUp} tone="green" />
        <SummaryCard label="Despesas" cents={summary.expense} icon={ArrowDown} tone="red" />
        <SummaryCard label="Balanço mensal" cents={summary.balance} icon={Scale} tone="teal" />
      </div>

      <section className="card flex flex-col gap-4 p-0">
        <div className="flex flex-col gap-3 p-5 pb-0">
          <MonthNav month={month} basePath="/transacoes" />
          <div className="flex flex-wrap justify-center gap-2">
            {FILTERS.map((f) => {
              const href = `/transacoes?mes=${monthKey(month)}${f.key ? `&tipo=${f.key}` : ""}`;
              const active = (type ?? "") === f.key;
              return (
                <Link
                  key={f.key}
                  href={href}
                  className={`rounded-full px-3 py-1 text-sm ${
                    active ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>
        </div>

        {transactions.length === 0 ? (
          <p className="py-16 text-center text-slate-500">Nenhuma transação neste mês.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Situação</th>
                  <th className="px-3 py-3 font-medium">Data</th>
                  <th className="px-3 py-3 font-medium">Descrição</th>
                  <th className="px-3 py-3 font-medium">Categoria</th>
                  <th className="px-3 py-3 font-medium">Conta</th>
                  <th className="px-3 py-3 text-right font-medium">Valor</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => {
                  const color =
                    t.type === "INCOME" ? "text-green-700" : t.type === "EXPENSE" ? "text-red-600" : "text-slate-700";
                  const sign = t.type === "INCOME" ? "+" : t.type === "EXPENSE" ? "−" : "";
                  return (
                    <tr key={t.id}>
                      <td className="px-5 py-3">
                        <form action={togglePaid}>
                          <input type="hidden" name="id" value={t.id} />
                          <button
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              t.paid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                            }`}
                            title="Alternar situação"
                          >
                            {t.paid ? <Check className="size-3" /> : <Clock className="size-3" />}
                            {t.paid ? "Efetivada" : "Pendente"}
                          </button>
                        </form>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{formatDay(t.date)}</td>
                      <td className="px-3 py-3 font-medium">{t.description}</td>
                      <td className="px-3 py-3">
                        {t.type === "TRANSFER" ? (
                          <span className="text-slate-500">Transferência</span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="size-2.5 rounded-full"
                              style={{ background: t.category?.color ?? "#94a3b8" }}
                            />
                            {t.category?.name ?? "Sem categoria"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {t.account.name}
                        {t.toAccount && ` → ${t.toAccount.name}`}
                      </td>
                      <td className={`px-3 py-3 text-right font-semibold ${color}`}>
                        {sign} {formatCents(t.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Link href={`/transacoes/${t.id}`} className="btn-ghost p-2" title="Editar">
                            <Pencil className="size-4" />
                          </Link>
                          <form action={deleteTransaction}>
                            <input type="hidden" name="id" value={t.id} />
                            <button className="btn-ghost p-2 hover:text-red-600" title="Excluir">
                              <Trash2 className="size-4" />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
