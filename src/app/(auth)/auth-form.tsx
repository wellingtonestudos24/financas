"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "./actions";

type Props = {
  mode: "login" | "cadastro";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
};

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignUp = mode === "cadastro";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isSignUp && (
        <label className="field">
          <span>Nome</span>
          <input name="name" autoComplete="name" required />
        </label>
      )}
      <label className="field">
        <span>E-mail</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span>Senha</span>
        <input
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          minLength={isSignUp ? 8 : undefined}
          required
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button className="btn-primary" disabled={pending}>
        {pending ? "Aguarde…" : isSignUp ? "Criar conta" : "Entrar"}
      </button>

      <p className="text-center text-sm text-slate-500">
        {isSignUp ? "Já tem conta? " : "Ainda não tem conta? "}
        <Link href={isSignUp ? "/login" : "/cadastro"} className="font-medium text-teal-700 hover:underline">
          {isSignUp ? "Entrar" : "Criar conta"}
        </Link>
      </p>
    </form>
  );
}
