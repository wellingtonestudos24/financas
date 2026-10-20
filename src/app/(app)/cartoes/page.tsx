import Link from "next/link";
import { Suspense } from "react";
import { CalendarClock, CreditCard, Pencil, Plus, Wallet } from "lucide-react";
import { SummaryCard } from "@/components/summary-card";
import { requireUser } from "@/lib/auth";
import { cardsOverview } from "@/lib/cards";
import { formatDate, monthKey } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { InvoiceStatusBadge } from "./invoice-status";

export const metadata = { title: "Cartões — Finanças" };

export default function CardsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Cartões de crédito</h1>
        <Link href="/cartoes/novo" className="btn-primary">
          <Plus className="size-4" /> Novo cartão
        </Link>
      </div>
      <Suspense fallback={<div className="card h-48 animate-pulse" />}>
        <Cards />
      </Suspense>
    </div>
  );
}

async function Cards() {
  const user = await requireUser();
  const { cards, totalAvailable, totalUsed } = await cardsOverview(user.id);
  const nextDue = cards
    .filter((c) => c.used > 0)
    .map((c) => c.nextDue)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (cards.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 py-12 text-center">
        <CreditCard className="size-10 text-slate-300" />
        <p className="text-slate-600">Você ainda não cadastrou nenhum cartão.</p>
        <Link href="/cartoes/novo" className="btn-primary">
          <Plus className="size-4" /> Novo cartão de crédito
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="grid content-start gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const usedPercent = Math.min(100, Math.round((card.used / card.limit) * 100));
          const invoice = card.currentInvoice;
          return (
            <article key={card.id} className="card flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-full text-white"
                  style={{ background: card.color }}
                >
                  <CreditCard className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">{card.name}</h2>
                  <p className="text-xs text-slate-500">
                    Fecha dia {card.closingDay} · vence dia {card.dueDay}
                  </p>
                </div>
                <Link href={`/cartoes/${card.id}/editar`} className="btn-ghost p-2" title="Editar cartão">
                  <Pencil className="size-4" />
                </Link>
              </div>

              <Link
                href={`/cartoes/${card.id}?fatura=${monthKey(invoice.month)}`}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 hover:bg-slate-100"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    Fatura atual <InvoiceStatusBadge status={invoice.status} />
                  </p>
                  <p className="text-lg font-semibold">{formatCents(invoice.total)}</p>
                </div>
                <p className="text-right text-xs text-slate-500">
                  Vence em
                  <br />
                  <span className="font-medium text-slate-700">{formatDate(invoice.due)}</span>
                </p>
              </Link>

              <div className="flex flex-col gap-1 text-sm">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${usedPercent}%`, background: card.color }} />
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Usado {formatCents(card.used)}</span>
                  <span>
                    Disponível <span className="font-medium text-slate-800">{formatCents(card.available)}</span>
                  </span>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-3 text-sm">
                <Link
                  href={`/transacoes/nova?tipo=EXPENSE&conta=card:${card.id}`}
                  className="font-medium text-red-600 hover:underline"
                >
                  + Compra no cartão
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        <div className="card flex items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <CalendarClock className="size-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Próximo vencimento</p>
            <p className="text-xl font-semibold">{nextDue ? formatDate(nextDue) : "—"}</p>
          </div>
        </div>
        <SummaryCard label="Limite disponível" cents={totalAvailable} icon={Wallet} tone="teal" />
        <SummaryCard label="Total a pagar" cents={totalUsed} icon={CreditCard} tone="red" />
      </div>
    </div>
  );
}
