import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { isTransactionType } from "@/lib/labels";
import { transactionFormOptions } from "../form-data";
import { TransactionForm } from "../transaction-form";

export const metadata = { title: "Nova transação — Finanças" };

export default function NewTransactionPage({ searchParams }: PageProps<"/transacoes/nova">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nova transação</h1>
      <Suspense fallback={<div className="card h-96 max-w-xl animate-pulse" />}>
        <NewTransaction searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewTransaction({ searchParams }: { searchParams: PageProps<"/transacoes/nova">["searchParams"] }) {
  const params = await searchParams;
  const user = await requireUser();
  const { accounts, categories } = await transactionFormOptions(user.id);

  if (accounts.length === 0) {
    return (
      <div className="card max-w-xl">
        <p className="text-slate-600">Crie uma conta antes de lançar transações.</p>
        <Link href="/contas/nova" className="btn-primary mt-4">
          Criar conta
        </Link>
      </div>
    );
  }

  const accountId = typeof params.conta === "string" && accounts.some((a) => a.id === params.conta)
    ? params.conta
    : accounts[0].id;

  return (
    <TransactionForm
      accounts={accounts}
      categories={categories}
      initial={{
        type: isTransactionType(params.tipo) ? params.tipo : "EXPENSE",
        description: "",
        amount: "",
        date: todayISO(),
        paid: true,
        accountId,
        toAccountId: "",
        categoryId: "",
      }}
    />
  );
}
