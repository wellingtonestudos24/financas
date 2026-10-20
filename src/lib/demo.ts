// Conta de demonstração: usada pelo seed (npm run db:seed) e pelo botão "Entrar como demonstração".
// Sem "server-only" e com imports relativos porque o seed roda fora do Next (tsx).
import bcrypt from "bcryptjs";
import type { PrismaClient, TransactionType } from "../generated/prisma/client";

export const DEMO_EMAIL = "demo@financas.test";
export const DEMO_PASSWORD = "demo-financas-123";

// Mesma regra de src/lib/cards.ts (que não roda fora do Next por causa do "server-only").
const CLOSING_DAY = 5;
function invoiceMonth(date: Date) {
  const delta = date.getUTCDate() >= CLOSING_DAY ? 1 : 0;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
}

function day(offset: number, monthDelta = 0) {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth() + monthDelta, offset));
}

/**
 * Recria os dados da conta demo com lançamentos do mês atual e devolve o id do usuário.
 * O usuário é mantido (mesmo id) para não derrubar a sessão de quem já está navegando.
 */
export async function resetDemoUser(db: PrismaClient): Promise<string> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  return db.$transaction(async (tx) => {
    const { id: userId } = await tx.user.upsert({
      where: { email: DEMO_EMAIL },
      update: { name: "Demo", passwordHash },
      create: { name: "Demo", email: DEMO_EMAIL, passwordHash },
    });

    await tx.transaction.deleteMany({ where: { userId } });
    await tx.creditCard.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });
    await tx.category.deleteMany({ where: { userId } });

    const { accounts, categories } = await tx.user.update({
      where: { id: userId },
      data: {
        accounts: {
          create: [
            { name: "Banco", type: "CHECKING", color: "#2563eb", initialBalance: 250000 },
            { name: "Carteira", type: "WALLET", color: "#0f766e", initialBalance: 15000 },
          ],
        },
        categories: {
          create: [
            { name: "Salário", type: "INCOME", color: "#16a34a" },
            { name: "Freelas", type: "INCOME", color: "#0891b2" },
            { name: "Alimentação", type: "EXPENSE", color: "#ea580c" },
            { name: "Moradia", type: "EXPENSE", color: "#7c3aed" },
            { name: "Transporte", type: "EXPENSE", color: "#2563eb" },
            { name: "Lazer", type: "EXPENSE", color: "#db2777" },
          ],
        },
      },
      include: { accounts: true, categories: true },
    });

    const account = (name: string) => accounts.find((a) => a.name === name)!.id;
    const category = (name: string) => categories.find((c) => c.name === name)!.id;

    await tx.transaction.createMany({
      data: [
        { type: "INCOME", description: "Salário", amount: 650000, date: day(5), accountId: account("Banco"), categoryId: category("Salário") },
        { type: "INCOME", description: "Site para cliente", amount: 120000, date: day(25), paid: false, accountId: account("Banco"), categoryId: category("Freelas") },
        { type: "EXPENSE", description: "Aluguel", amount: 180000, date: day(10), accountId: account("Banco"), categoryId: category("Moradia") },
        { type: "EXPENSE", description: "Mercado", amount: 64320, date: day(8), accountId: account("Banco"), categoryId: category("Alimentação") },
        { type: "EXPENSE", description: "Restaurante", amount: 8950, date: day(12), accountId: account("Carteira"), categoryId: category("Alimentação") },
        { type: "EXPENSE", description: "Combustível", amount: 25000, date: day(14), accountId: account("Banco"), categoryId: category("Transporte") },
        { type: "EXPENSE", description: "Cinema", amount: 6000, date: day(18), accountId: account("Carteira"), categoryId: category("Lazer") },
        { type: "EXPENSE", description: "Internet", amount: 11990, date: day(28), paid: false, accountId: account("Banco"), categoryId: category("Moradia") },
        { type: "TRANSFER", description: "Saque", amount: 20000, date: day(9), accountId: account("Banco"), toAccountId: account("Carteira") },
      ].map((t) => ({ ...t, type: t.type as TransactionType, userId })),
    });

    const card = await tx.creditCard.create({
      data: {
        userId,
        name: "Cartão principal",
        color: "#7c3aed",
        limit: 500000,
        closingDay: CLOSING_DAY,
        dueDay: 12,
        paymentAccountId: account("Banco"),
      },
    });
    const purchases = [
      { description: "Farmácia", amount: 4500, date: day(25, -1), categoryId: category("Lazer") },
      { description: "Streaming", amount: 3990, date: day(2), categoryId: category("Lazer") },
      { description: "Delivery", amount: 7800, date: day(7), categoryId: category("Alimentação") },
      { description: "Tênis", amount: 32000, date: day(15), categoryId: category("Lazer") },
    ];
    await tx.transaction.createMany({
      data: purchases.map((p) => ({
        ...p,
        type: "EXPENSE" as const,
        userId,
        creditCardId: card.id,
        invoiceMonth: invoiceMonth(p.date),
      })),
    });
    // Fatura que fechou neste mês (Farmácia + Streaming), já paga.
    await tx.transaction.create({
      data: {
        userId,
        type: "CARD_PAYMENT",
        description: `Fatura ${card.name}`,
        amount: 8490,
        date: day(12),
        accountId: account("Banco"),
        creditCardId: card.id,
        invoiceMonth: day(1),
      },
    });

    return userId;
  });
}
