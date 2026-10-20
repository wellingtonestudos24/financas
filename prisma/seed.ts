// Cria um usuário de demonstração com dados do mês atual.
// Uso: npm run db:seed   (login: demo@financas.test / demo-financas-123)
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type TransactionType } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const EMAIL = "demo@financas.test";
const PASSWORD = "demo-financas-123";

function day(offset: number) {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), offset));
}

async function main() {
  await db.user.deleteMany({ where: { email: EMAIL } });

  const user = await db.user.create({
    data: {
      name: "Demo",
      email: EMAIL,
      passwordHash: await bcrypt.hash(PASSWORD, 12),
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

  const account = (name: string) => user.accounts.find((a) => a.name === name)!.id;
  const category = (name: string) => user.categories.find((c) => c.name === name)!.id;

  await db.transaction.createMany({
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
    ].map((t) => ({ ...t, type: t.type as TransactionType, userId: user.id })),
  });

  console.log(`Usuário de demonstração criado: ${EMAIL}`);
}

main().finally(() => db.$disconnect());
