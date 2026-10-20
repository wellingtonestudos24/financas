import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { MonthNav } from "@/components/month-nav";
import { requireUser } from "@/lib/auth";
import { invoiceDetail, invoiceMonthFor } from "@/lib/cards";
import { db } from "@/lib/db";
import { formatDate, formatDay, monthKey, parseISODate, parseMonth, todayISO } from "@/lib/dates";
import { centsToInput, formatCents } from "@/lib/money";
import { deleteTransaction } from "../../actions";
import { InvoiceStatusBadge } from "../invoice-status";
import { PaymentForm } from "./payment-form";

export const metadata = { title: "Fatura — Finanças" };

export default function InvoicePage({ params, searchParams }: PageProps<"/cartoes/[id]">) {
  return (
    <Suspense fallback={<div className="card h-96 animate-pulse" />}>
      <Invoice params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Invoice({
  params,
  searchParams,
}: Pick<PageProps<"/cartoes/[id]">, "params" | "searchParams">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser();

  const card = await db.creditCard.findFirst({ where: { id, userId: user.id } });
  if (!card) notFound();

  // Sem ?fatura, abre a fatura em que uma compra feita hoje cairia.
  const month = query.fatura
    ? parseMonth(query.fatura)
    : invoiceMonthFor(parseISODate(todayISO())!, card.closingDay);

  const [invoice, accounts] = await Promise.all([
    invoiceDetail(user.id, card.id, month),
    db.account.findMany({ where: { userId: user.id }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!invoice) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="size-4 rounded-full" style={{ background: card.color }} />
          <h1 className="text-2xl font-semibold">{card.name}</h1>
          <Link href={`/cartoes/${card.id}/editar`} className="btn-ghost p-2" title="Editar cartão">
            <Pencil className="size-4" />
          </Link>
        </div>
        <Link href={`/transacoes/nova?tipo=EXPENSE&conta=card:${card.id}`} className="btn-primary">
          <Plus className="size-4" /> Nova compra
        </Link>
      </div>

      <MonthNav month={month} basePath={`/cartoes/${card.id}`} param="fatura" />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card flex flex-col gap-4 p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-0">
            <h2 className="font-semibold">Compras da fatura</h2>
            <p className="text-sm text-slate-500">
              Fecha {formatDate(invoice.closing)} · vence {formatDate(invoice.due)}
            </p>
          </div>
          {invoice.purchases.length === 0 ? (
            <p className="py-14 text-center text-slate-500">Nenhuma compra nesta fatura.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {invoice.purchases.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-12 text-slate-500">{formatDay(t.date)}</span>
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: t.category?.color ?? "#94a3b8" }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.description}</p>
                    <p className="text-xs text-slate-500">{t.category?.name ?? "Sem categoria"}</p>
                  </div>
                  <span className="font-semibold text-red-600">{formatCents(t.amount)}</span>
                  <Link href={`/transacoes/${t.id}`} className="btn-ghost p-2" title="Editar">
                    <Pencil className="size-4" />
                  </Link>
                  <form action={deleteTransaction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="btn-ghost p-2 hover:text-red-600" title="Excluir">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <div className="card flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total da fatura</p>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-3xl font-semibold">{formatCents(invoice.total)}</p>
            <dl className="grid gap-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Pago</dt>
                <dd className="font-medium text-green-700">{formatCents(invoice.paid)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Falta pagar</dt>
                <dd className="font-medium">{formatCents(invoice.remaining)}</dd>
              </div>
            </dl>
          </div>

          {invoice.remaining > 0 && accounts.length > 0 && (
            <div className="card">
              <PaymentForm
                key={`${monthKey(month)}-${invoice.remaining}`}
                cardId={card.id}
                invoice={monthKey(month)}
                accounts={accounts}
                defaultAccountId={card.paymentAccountId ?? accounts[0].id}
                defaultAmount={centsToInput(invoice.remaining)}
                today={todayISO()}
              />
            </div>
          )}

          {invoice.payments.length > 0 && (
            <div className="card flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Pagamentos</h3>
              <ul className="divide-y divide-slate-100 text-sm">
                {invoice.payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 py-2">
                    <span className="text-slate-500">{formatDate(p.date)}</span>
                    <span className="flex-1 truncate">{p.account?.name}</span>
                    <span className="font-medium">{formatCents(p.amount)}</span>
                    <form action={deleteTransaction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn-ghost p-1.5 hover:text-red-600" title="Desfazer pagamento">
                        <Trash2 className="size-3.5" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
