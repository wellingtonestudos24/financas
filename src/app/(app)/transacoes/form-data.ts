import "server-only";
import { db } from "@/lib/db";

export async function transactionFormOptions(userId: string) {
  const [accounts, categories] = await Promise.all([
    db.account.findMany({ where: { userId }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
    db.category.findMany({
      where: { userId, type: { in: ["INCOME", "EXPENSE"] } },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { accounts, categories };
}
