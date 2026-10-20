import "server-only";
import { db } from "./db";
import { monthRange, parseISODate, todayISO, type Month } from "./dates";

type BalanceScope = {
  // Considera transações com data anterior a este instante.
  before: Date;
  // true = só o que já foi pago/recebido (saldo atual); false = inclui pendentes (saldo previsto).
  onlyPaid: boolean;
};

export async function accountBalances(userId: string, scope: BalanceScope) {
  const where = {
    userId,
    date: { lt: scope.before },
    ...(scope.onlyPaid ? { paid: true } : {}),
  };

  const [accounts, outgoing, incoming] = await Promise.all([
    db.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    db.transaction.groupBy({ by: ["accountId", "type"], where, _sum: { amount: true } }),
    db.transaction.groupBy({
      by: ["toAccountId"],
      where: { ...where, type: "TRANSFER" },
      _sum: { amount: true },
    }),
  ]);

  const balances = new Map(accounts.map((a) => [a.id, a.initialBalance]));
  for (const row of outgoing) {
    // Compras no cartão não mexem em conta; só o pagamento da fatura (CARD_PAYMENT) mexe.
    if (!row.accountId) continue;
    const sign = row.type === "INCOME" ? 1 : -1;
    balances.set(row.accountId, (balances.get(row.accountId) ?? 0) + sign * (row._sum.amount ?? 0));
  }
  for (const row of incoming) {
    if (!row.toAccountId) continue;
    balances.set(row.toAccountId, (balances.get(row.toAccountId) ?? 0) + (row._sum.amount ?? 0));
  }

  return accounts.map((account) => ({ ...account, balance: balances.get(account.id) ?? 0 }));
}

// Saldo atual (pago até hoje) e previsto (tudo até o fim do mês) de cada conta.
export async function accountsOverview(userId: string, month: Month) {
  const tomorrow = parseISODate(todayISO())!;
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const [current, predicted] = await Promise.all([
    accountBalances(userId, { before: tomorrow, onlyPaid: true }),
    accountBalances(userId, { before: monthRange(month).end, onlyPaid: false }),
  ]);
  const predictedById = new Map(predicted.map((a) => [a.id, a.balance]));

  const accounts = current.map((a) => ({
    ...a,
    currentBalance: a.balance,
    predictedBalance: predictedById.get(a.id) ?? a.balance,
  }));
  return {
    accounts,
    totalCurrent: accounts.reduce((sum, a) => sum + a.currentBalance, 0),
    totalPredicted: accounts.reduce((sum, a) => sum + a.predictedBalance, 0),
  };
}

export async function monthSummary(userId: string, month: Month) {
  const { start, end } = monthRange(month);
  const totals = await db.transaction.groupBy({
    by: ["type"],
    where: { userId, date: { gte: start, lt: end }, type: { in: ["INCOME", "EXPENSE"] } },
    _sum: { amount: true },
  });
  const income = totals.find((t) => t.type === "INCOME")?._sum.amount ?? 0;
  const expense = totals.find((t) => t.type === "EXPENSE")?._sum.amount ?? 0;
  return { income, expense, balance: income - expense };
}

export async function totalsByCategory(userId: string, month: Month, type: "INCOME" | "EXPENSE") {
  const { start, end } = monthRange(month);
  const [rows, categories] = await Promise.all([
    db.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type, date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    db.category.findMany({ where: { userId, type } }),
  ]);
  const byId = new Map(categories.map((c) => [c.id, c]));

  return rows
    .map((row) => {
      const category = row.categoryId ? byId.get(row.categoryId) : undefined;
      return {
        name: category?.name ?? "Sem categoria",
        color: category?.color ?? "#94a3b8",
        total: row._sum.amount ?? 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}
