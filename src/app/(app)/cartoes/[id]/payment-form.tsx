"use client";

import { useActionState } from "react";
import { payInvoice } from "../../actions";

type Props = {
  cardId: string;
  invoice: string;
  accounts: { id: string; name: string }[];
  defaultAccountId: string;
  defaultAmount: string;
  today: string;
};

export function PaymentForm({ cardId, invoice, accounts, defaultAccountId, defaultAmount, today }: Props) {
  const [state, formAction, pending] = useActionState(payInvoice, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="cardId" value={cardId} />
      <input type="hidden" name="invoice" value={invoice} />
      <label className="field">
        <span>Pagar com</span>
        <select name="accountId" defaultValue={defaultAccountId} required>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="field">
          <span>Valor (R$)</span>
          <input name="amount" inputMode="decimal" defaultValue={defaultAmount} required />
        </label>
        <label className="field">
          <span>Data</span>
          <input name="date" type="date" defaultValue={today} required />
        </label>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>
        {pending ? "Registrando…" : "Pagar fatura"}
      </button>
    </form>
  );
}
