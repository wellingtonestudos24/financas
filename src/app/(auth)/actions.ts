"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { endSession, startSession } from "@/lib/session";

export type AuthState = { error?: string };

const DEFAULT_CATEGORIES = [
  { name: "Salário", type: "INCOME", color: "#16a34a" },
  { name: "Investimentos", type: "INCOME", color: "#0891b2" },
  { name: "Outras receitas", type: "INCOME", color: "#65a30d" },
  { name: "Alimentação", type: "EXPENSE", color: "#ea580c" },
  { name: "Moradia", type: "EXPENSE", color: "#7c3aed" },
  { name: "Transporte", type: "EXPENSE", color: "#2563eb" },
  { name: "Saúde", type: "EXPENSE", color: "#dc2626" },
  { name: "Lazer", type: "EXPENSE", color: "#db2777" },
  { name: "Educação", type: "EXPENSE", color: "#0d9488" },
  { name: "Outras despesas", type: "EXPENSE", color: "#64748b" },
] as const;

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  email: z.email("E-mail inválido").trim().toLowerCase(),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { error: "Já existe uma conta com esse e-mail" };
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      accounts: { create: { name: "Carteira", type: "WALLET" } },
      categories: { create: [...DEFAULT_CATEGORIES] },
    },
  });
  await startSession(user.id);
  redirect("/");
}

const signInSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
});

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = signInSchema.parse(Object.fromEntries(formData));
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "E-mail ou senha incorretos" };
  }
  await startSession(user.id);
  redirect("/");
}

export async function signOut() {
  await endSession();
  redirect("/login");
}
