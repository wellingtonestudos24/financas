import "server-only";
import { cardOptions } from "@/lib/cards";
import { db } from "@/lib/db";

export async function transactionFormOptions(userId: string) {
  const [accounts, cards, categories] = await Promise.all([
    db.account.findMany({ where: { userId }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
    cardOptions(userId),
    db.category.findMany({
      where: { userId, type: { in: ["INCOME", "EXPENSE"] } },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { accounts, cards, categories };
}
