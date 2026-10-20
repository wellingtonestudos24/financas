import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toISODate } from "@/lib/dates";
import { centsToInput } from "@/lib/money";
import { transactionFormOptions } from "../form-data";
import { TransactionForm } from "../transaction-form";

export const metadata = { title: "Editar transação — Finanças" };

export default function EditTransactionPage({ params }: PageProps<"/transacoes/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Editar transação</h1>
      <Suspense fallback={<div className="card h-96 max-w-xl animate-pulse" />}>
        <EditTransaction params={params} />
      </Suspense>
    </div>
  );
}

async function EditTransaction({ params }: { params: PageProps<"/transacoes/[id]">["params"] }) {
  const { id } = await params;
  const user = await requireUser();
  const [transaction, options] = await Promise.all([
    db.transaction.findFirst({ where: { id, userId: user.id } }),
    transactionFormOptions(user.id),
  ]);
  if (!transaction) notFound();

  return (
    <TransactionForm
      {...options}
      initial={{
        id: transaction.id,
        type: transaction.type,
        description: transaction.description,
        amount: centsToInput(transaction.amount),
        date: toISODate(transaction.date),
        paid: transaction.paid,
        accountId: transaction.accountId,
        toAccountId: transaction.toAccountId ?? "",
        categoryId: transaction.categoryId ?? "",
      }}
    />
  );
}
