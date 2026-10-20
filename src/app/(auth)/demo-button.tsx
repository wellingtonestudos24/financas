"use client";

import { useFormStatus } from "react-dom";

export function DemoButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-full rounded-lg border border-teal-700 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-60"
    >
      {pending ? "Preparando a demonstração…" : "Entrar como demonstração"}
    </button>
  );
}
