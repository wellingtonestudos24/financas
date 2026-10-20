"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveCard } from "../actions";

type Props = {
  accounts: { id: string; name: string }[];
  initial: {
    id?: string;
    name: string;
    color: string;
    limit: string;
    closingDay: number;
    dueDay: number;
    paymentAccountId: string;
  };
};

export function CardForm({ accounts, initial }: Props) {
  const [state, formAction, pending] = useActionState(saveCard, {});

  return (
    <form action={formAction} className="card flex max-w-xl flex-col gap-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="field">
          <span>Nome</span>
          <input name="name" defaultValue={initial.name} placeholder="Ex.: Nubank, Inter" required />
        </label>
        <label className="field">
          <span>Cor</span>
          <input name="color" type="color" defaultValue={initial.color} className="h-[42px] w-16 p-1" />
        </label>
      </div>

      <label className="field">
        <span>Limite (R$)</span>
        <input name="limit" inputMode="decimal" defaultValue={initial.limit} placeholder="0,00" required />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>Dia de fechamento</span>
          <input name="closingDay" type="number" min={1} max={28} defaultValue={initial.closingDay} required />
        </label>
        <label className="field">
          <span>Dia de vencimento</span>
          <input name="dueDay" type="number" min={1} max={28} defaultValue={initial.dueDay} required />
        </label>
      </div>
      <p className="-mt-2 text-xs text-slate-500">
        Compras a partir do dia de fechamento entram na fatura do mês seguinte.
      </p>

      <label className="field">
        <span>Conta para pagar a fatura</span>
        <select name="paymentAccountId" defaultValue={initial.paymentAccountId}>
          <option value="">Escolher na hora</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <Link href="/cartoes" className="btn-ghost">
          Cancelar
        </Link>
        <button className="btn-primary" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
