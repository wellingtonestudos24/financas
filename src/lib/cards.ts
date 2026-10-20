import "server-only";
import { db } from "./db";
import { monthKey, parseISODate, shiftMonth, todayISO, type Month } from "./dates";

// Regra das faturas: uma compra feita antes do dia de fechamento entra na fatura que fecha
// neste mês; a partir do dia de fechamento, entra na do mês seguinte. A fatura é
// identificada pelo mês em que fecha e vence no mesmo mês (se o vencimento é depois do
// fechamento) ou no mês seguinte.

type CardDays = { closingDay: number; dueDay: number };

export function invoiceMonthFor(date: Date, closingDay: number): Month {
  const month = { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
  return date.getUTCDate() >= closingDay ? shiftMonth(month, 1) : month;
}

export function monthToDate({ year, month }: Month) {
  return new Date(Date.UTC(year, month - 1, 1));
}

export function dateToMonth(date: Date): Month {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function invoiceDates(month: Month, card: CardDays) {
  const dueMonth = card.dueDay > card.closingDay ? month : shiftMonth(month, 1);
  return {
    closing: new Date(Date.UTC(month.year, month.month - 1, card.closingDay)),
    due: new Date(Date.UTC(dueMonth.year, dueMonth.month - 1, card.dueDay)),
  };
}

export type InvoiceStatus = "open" | "closed" | "paid";

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  open: "Aberta",
  closed: "Fechada",
  paid: "Paga",
};

function invoiceStatus(total: number, paid: number, closing: Date): InvoiceStatus {
  if (total > 0 && paid >= total) return "paid";
  return parseISODate(todayISO())! >= closing ? "closed" : "open";
}

function today() {
  return parseISODate(todayISO())!;
}

// Totais de compras e pagamentos por cartão e mês de fatura.
async function invoiceTotals(userId: string, cardIds: string[]) {
  const rows = await db.transaction.groupBy({
    by: ["creditCardId", "invoiceMonth", "type"],
    where: { userId, creditCardId: { in: cardIds } },
    _sum: { amount: true },
  });
  const totals = new Map<string, { purchases: number; payments: number }>();
  for (const row of rows) {
    if (!row.creditCardId || !row.invoiceMonth) continue;
    const key = `${row.creditCardId}:${monthKey(dateToMonth(row.invoiceMonth))}`;
    const entry = totals.get(key) ?? { purchases: 0, payments: 0 };
    if (row.type === "EXPENSE") entry.purchases += row._sum.amount ?? 0;
    if (row.type === "CARD_PAYMENT") entry.payments += row._sum.amount ?? 0;
    totals.set(key, entry);
  }
  return totals;
}

export async function cardsOverview(userId: string) {
  const cards = await db.creditCard.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  const totals = await invoiceTotals(userId, cards.map((c) => c.id));

  const overview = cards.map((card) => {
    let used = 0;
    for (const [key, t] of totals) {
      if (key.startsWith(`${card.id}:`)) used += t.purchases - t.payments;
    }
    used = Math.max(used, 0);

    const current = invoiceMonthFor(today(), card.closingDay);
    const currentTotals = totals.get(`${card.id}:${monthKey(current)}`) ?? { purchases: 0, payments: 0 };
    const { closing, due } = invoiceDates(current, card);

    // Próxima fatura a vencer que ainda tem saldo em aberto (a fechada vem antes da atual).
    const previous = shiftMonth(current, -1);
    const previousTotals = totals.get(`${card.id}:${monthKey(previous)}`);
    const previousOwed = previousTotals ? previousTotals.purchases - previousTotals.payments : 0;
    const nextDue = previousOwed > 0 ? invoiceDates(previous, card).due : due;

    return {
      ...card,
      used,
      available: card.limit - used,
      currentInvoice: {
        month: current,
        total: currentTotals.purchases,
        status: invoiceStatus(currentTotals.purchases, currentTotals.payments, closing),
        closing,
        due,
      },
      nextDue,
    };
  });

  return {
    cards: overview,
    totalLimit: overview.reduce((s, c) => s + c.limit, 0),
    totalAvailable: overview.reduce((s, c) => s + c.available, 0),
    totalUsed: overview.reduce((s, c) => s + c.used, 0),
  };
}

export async function invoiceDetail(userId: string, cardId: string, month: Month) {
  const card = await db.creditCard.findFirst({ where: { id: cardId, userId }, include: { paymentAccount: true } });
  if (!card) return null;

  const transactions = await db.transaction.findMany({
    where: { userId, creditCardId: card.id, invoiceMonth: monthToDate(month) },
    include: { category: true, account: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  const purchases = transactions.filter((t) => t.type === "EXPENSE");
  const payments = transactions.filter((t) => t.type === "CARD_PAYMENT");
  const total = purchases.reduce((s, t) => s + t.amount, 0);
  const paid = payments.reduce((s, t) => s + t.amount, 0);
  const { closing, due } = invoiceDates(month, card);

  return {
    card,
    purchases,
    payments,
    total,
    paid,
    remaining: Math.max(total - paid, 0),
    closing,
    due,
    status: invoiceStatus(total, paid, closing),
  };
}

export async function cardOptions(userId: string) {
  return db.creditCard.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
}
