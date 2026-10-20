"use client";

import { useActionState, useRef } from "react";
import { Plus } from "lucide-react";
import { createCategory, type FormState } from "../actions";

export function CategoryForm({ type }: { type: "INCOME" | "EXPENSE" }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await createCategory(prev, formData);
    if (!result.error) formRef.current?.reset();
    return result;
  }, {});

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="type" value={type} />
      <div className="flex gap-2">
        <input
          name="color"
          type="color"
          defaultValue={type === "INCOME" ? "#16a34a" : "#ea580c"}
          className="h-10 w-12 shrink-0 rounded-lg border border-slate-300 p-1"
          aria-label="Cor"
        />
        <input
          name="name"
          placeholder="Nova categoria"
          required
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-600"
        />
        <button className="btn-primary px-3" disabled={pending} title="Adicionar">
          <Plus className="size-4" />
        </button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
