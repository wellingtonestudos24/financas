import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { centsToInput } from "@/lib/money";
import { deleteCard } from "../../../actions";
import { CardForm } from "../../card-form";

export const metadata = { title: "Editar cartão — Finanças" };

export default function EditCardPage({ params }: PageProps<"/cartoes/[id]/editar">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Editar cartão</h1>
      <Suspense fallback={<div className="card h-96 max-w-xl animate-pulse" />}>
        <EditCard params={params} />
      </Suspense>
    </div>
  );
}

async function EditCard({ params }: { params: PageProps<"/cartoes/[id]/editar">["params"] }) {
  const { id } = await params;
  const user = await requireUser();
  const [card, accounts] = await Promise.all([
    db.creditCard.findFirst({ where: { id, userId: user.id }, include: { _count: { select: { transactions: true } } } }),
    db.account.findMany({ where: { userId: user.id }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!card) notFound();
  const linked = card._count.transactions;

  return (
    <>
      <CardForm
        accounts={accounts}
        initial={{
          id: card.id,
          name: card.name,
          color: card.color,
          limit: centsToInput(card.limit),
          closingDay: card.closingDay,
          dueDay: card.dueDay,
          paymentAccountId: card.paymentAccountId ?? "",
        }}
      />
      <form action={deleteCard} className="card flex max-w-xl flex-col gap-3 border border-red-100">
        <input type="hidden" name="id" value={card.id} />
        <p className="text-sm text-slate-600">
          Excluir o cartão apaga também {linked === 1 ? "1 lançamento ligado" : `${linked} lançamentos ligados`} a ele
          (compras e pagamentos de fatura).
        </p>
        <button className="btn-ghost self-start text-red-600 hover:bg-red-50">
          <Trash2 className="size-4" /> Excluir cartão
        </button>
      </form>
    </>
  );
}
