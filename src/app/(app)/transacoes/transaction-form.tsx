"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveTransaction } from "../actions";
import { TRANSACTION_TYPES, type TransactionTypeKey } from "@/lib/labels";

type Option = { id: string; name: string };
type CategoryOption = Option & { type: string };

type Props = {
  accounts: Option[];
  cards: Option[];
  categories: CategoryOption[];
  initial: {
    id?: string;
    type: TransactionTypeKey;
    description: string;
    amount: string;
    date: string;
    paid: boolean;
    accountId: string;
    toAccountId: string;
    categoryId: string;
  };
};

export function TransactionForm({ accounts, cards, categories, initial }: Props) {
  const [state, formAction, pending] = useActionState(saveTransaction, {});
  const [type, setType] = useState(initial.type);
  const [source, setSource] = useState(initial.accountId);
  const isTransfer = type === "TRANSFER";
  const canUseCard = type === "EXPENSE" && cards.length > 0;
  // Ao sair de "Despesa", um cartão escolhido deixa de valer e volta para a primeira conta.
  const selectedSource = !canUseCard && source.startsWith("card:") ? (accounts[0]?.id ?? "") : source;
  const onCard = selectedSource.startsWith("card:");
  const categoryOptions = categories.filter((c) => c.type === type);

  return (
    <form action={formAction} className="card flex max-w-xl flex-col gap-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
        {(Object.keys(TRANSACTION_TYPES) as TransactionTypeKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            className={`rounded-md py-2 text-sm font-medium ${
              type === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            {TRANSACTION_TYPES[key]}
          </button>
        ))}
      </div>

      <label className="field">
        <span>Descrição</span>
        <input name="description" defaultValue={initial.description} required />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>Valor (R$)</span>
          <input name="amount" inputMode="decimal" placeholder="0,00" defaultValue={initial.amount} required />
        </label>
        <label className="field">
          <span>Data</span>
          <input name="date" type="date" defaultValue={initial.date} required />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>{isTransfer ? "Conta de origem" : canUseCard ? "Conta ou cartão" : "Conta"}</span>
          <select name="accountId" value={selectedSource} onChange={(e) => setSource(e.target.value)} required>
            {canUseCard ? (
              <>
                <optgroup label="Contas">
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Cartões de crédito">
                  {cards.map((c) => (
                    <option key={c.id} value={`card:${c.id}`}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              </>
            ) : (
              accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))
            )}
          </select>
        </label>

        {isTransfer ? (
          <label className="field">
            <span>Conta de destino</span>
            <select name="toAccountId" defaultValue={initial.toAccountId} required>
              <option value="">Escolha…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field">
            <span>Categoria</span>
            <select
              key={type}
              name="categoryId"
              defaultValue={categoryOptions.some((c) => c.id === initial.categoryId) ? initial.categoryId : ""}
            >
              <option value="">Sem categoria</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {onCard ? (
        <p className="text-sm text-slate-500">A compra entra na fatura do cartão conforme a data e o dia de fechamento.</p>
      ) : (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="paid" defaultChecked={initial.paid} className="size-4 accent-teal-700" />
          {type === "INCOME" ? "Já recebi" : type === "EXPENSE" ? "Já paguei" : "Já transferi"}
        </label>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <Link href="/transacoes" className="btn-ghost">
          Cancelar
        </Link>
        <button className="btn-primary" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
