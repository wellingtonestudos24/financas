import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CardForm } from "../card-form";

export const metadata = { title: "Novo cartão — Finanças" };

export default function NewCardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Novo cartão de crédito</h1>
      <Suspense fallback={<div className="card h-96 max-w-xl animate-pulse" />}>
        <NewCard />
      </Suspense>
    </div>
  );
}

async function NewCard() {
  const user = await requireUser();
  const accounts = await db.account.findMany({
    where: { userId: user.id },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  return (
    <CardForm
      accounts={accounts}
      initial={{ name: "", color: "#7c3aed", limit: "", closingDay: 1, dueDay: 10, paymentAccountId: accounts[0]?.id ?? "" }}
    />
  );
}
