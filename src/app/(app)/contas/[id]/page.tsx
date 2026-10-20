import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { centsToInput } from "@/lib/money";
import { deleteAccount } from "../../actions";
import { AccountForm } from "../account-form";

export const metadata = { title: "Editar conta — Finanças" };

export default function EditAccountPage({ params }: PageProps<"/contas/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Editar conta</h1>
      <Suspense fallback={<div className="card h-80 max-w-xl animate-pulse" />}>
        <EditAccount params={params} />
      </Suspense>
    </div>
  );
}

async function EditAccount({ params }: { params: PageProps<"/contas/[id]">["params"] }) {
  const { id } = await params;
  const user = await requireUser();
  const account = await db.account.findFirst({
    where: { id, userId: user.id },
    include: { _count: { select: { transactions: true, transfersIn: true } } },
  });
  if (!account) notFound();
  const linked = account._count.transactions + account._count.transfersIn;

  return (
    <>
      <AccountForm
        initial={{
          id: account.id,
          name: account.name,
          type: account.type,
          color: account.color,
          initialBalance: centsToInput(account.initialBalance),
        }}
      />
      <form action={deleteAccount} className="card flex max-w-xl flex-col gap-3 border border-red-100">
        <input type="hidden" name="id" value={account.id} />
        <p className="text-sm text-slate-600">
          Excluir a conta apaga também {linked === 1 ? "1 transação ligada" : `${linked} transações ligadas`} a ela.
        </p>
        <button className="btn-ghost self-start text-red-600 hover:bg-red-50">
          <Trash2 className="size-4" /> Excluir conta
        </button>
      </form>
    </>
  );
}
