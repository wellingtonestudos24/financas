"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveAccount } from "../actions";
import { ACCOUNT_TYPES } from "@/lib/labels";

type Props = {
  initial: { id?: string; name: string; type: keyof typeof ACCOUNT_TYPES; color: string; initialBalance: string };
};

export function AccountForm({ initial }: Props) {
  const [state, formAction, pending] = useActionState(saveAccount, {});

  return (
    <form action={formAction} className="card flex max-w-xl flex-col gap-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <label className="field">
        <span>Nome</span>
        <input name="name" defaultValue={initial.name} placeholder="Ex.: Nubank, Itaú, Carteira" required />
      </label>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="field">
          <span>Tipo</span>
          <select name="type" defaultValue={initial.type}>
            {Object.entries(ACCOUNT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Cor</span>
          <input name="color" type="color" defaultValue={initial.color} className="h-[42px] w-16 p-1" />
        </label>
      </div>

      <label className="field">
        <span>Saldo inicial (R$)</span>
        <input name="initialBalance" inputMode="decimal" defaultValue={initial.initialBalance} required />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <Link href="/contas" className="btn-ghost">
          Cancelar
        </Link>
        <button className="btn-primary" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
