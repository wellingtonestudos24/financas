"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseISODate } from "@/lib/dates";
import { parseCents } from "@/lib/money";

export type FormState = { error?: string };

const money = z.string().transform((value, ctx) => {
  const cents = parseCents(value);
  if (cents === null) {
    ctx.addIssue({ code: "custom", message: "Valor inválido" });
    return z.NEVER;
  }
  return cents;
});

const isoDate = z.string().transform((value, ctx) => {
  const date = parseISODate(value);
  if (!date) {
    ctx.addIssue({ code: "custom", message: "Data inválida" });
    return z.NEVER;
  }
  return date;
});

const optionalId = z.string().transform((v) => v || null);

// ---------- Transações ----------

const transactionSchema = z
  .object({
    id: optionalId,
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    description: z.string().trim().min(1, "Informe uma descrição"),
    amount: money.refine((c) => c > 0, "O valor precisa ser maior que zero"),
    date: isoDate,
    accountId: z.string().min(1, "Escolha a conta"),
    toAccountId: optionalId,
    categoryId: optionalId,
    paid: z.literal("on").optional(),
  })
  .refine((t) => t.type !== "TRANSFER" || (t.toAccountId && t.toAccountId !== t.accountId), {
    message: "Escolha uma conta de destino diferente da de origem",
  });

export async function saveTransaction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = transactionSchema.safeParse({
    id: "",
    toAccountId: "",
    categoryId: "",
    ...Object.fromEntries(formData),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const t = parsed.data;
  const isTransfer = t.type === "TRANSFER";

  // Tudo o que vem do formulário precisa pertencer ao usuário.
  const accountIds = [t.accountId, ...(isTransfer && t.toAccountId ? [t.toAccountId] : [])];
  const owned = await db.account.count({ where: { userId: user.id, id: { in: accountIds } } });
  if (owned !== new Set(accountIds).size) return { error: "Conta não encontrada" };
  if (!isTransfer && t.categoryId) {
    const category = await db.category.findFirst({
      where: { id: t.categoryId, userId: user.id, type: t.type },
    });
    if (!category) return { error: "Categoria não encontrada" };
  }

  const data = {
    type: t.type,
    description: t.description,
    amount: t.amount,
    date: t.date,
    paid: t.paid === "on",
    accountId: t.accountId,
    toAccountId: isTransfer ? t.toAccountId : null,
    categoryId: isTransfer ? null : t.categoryId,
  };

  if (t.id) {
    const { count } = await db.transaction.updateMany({ where: { id: t.id, userId: user.id }, data });
    if (count === 0) return { error: "Transação não encontrada" };
  } else {
    await db.transaction.create({ data: { ...data, userId: user.id } });
  }
  redirect(`/transacoes?mes=${t.date.toISOString().slice(0, 7)}`);
}

export async function deleteTransaction(formData: FormData) {
  const user = await requireUser();
  await db.transaction.deleteMany({ where: { id: String(formData.get("id")), userId: user.id } });
  refresh();
}

export async function togglePaid(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const transaction = await db.transaction.findFirst({ where: { id, userId: user.id } });
  if (!transaction) return;
  await db.transaction.update({ where: { id }, data: { paid: !transaction.paid } });
  refresh();
}

// ---------- Contas ----------

const accountSchema = z.object({
  id: optionalId,
  name: z.string().trim().min(1, "Informe o nome da conta"),
  type: z.enum(["CHECKING", "SAVINGS", "WALLET", "INVESTMENT", "OTHER"]),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Cor inválida"),
  initialBalance: money,
});

export async function saveAccount(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = accountSchema.safeParse({ id: "", ...Object.fromEntries(formData) });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, ...data } = parsed.data;

  if (id) {
    const { count } = await db.account.updateMany({ where: { id, userId: user.id }, data });
    if (count === 0) return { error: "Conta não encontrada" };
  } else {
    await db.account.create({ data: { ...data, userId: user.id } });
  }
  redirect("/contas");
}

export async function deleteAccount(formData: FormData) {
  const user = await requireUser();
  // Apaga também as transações da conta (cascade no banco).
  await db.account.deleteMany({ where: { id: String(formData.get("id")), userId: user.id } });
  redirect("/contas");
}

// ---------- Categorias ----------

const categorySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da categoria"),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Cor inválida"),
});

export async function createCategory(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, type } = parsed.data;
  const exists = await db.category.findFirst({ where: { userId: user.id, name, type } });
  if (exists) return { error: "Já existe uma categoria com esse nome" };

  await db.category.create({ data: { ...parsed.data, userId: user.id } });
  refresh();
  return {};
}

export async function deleteCategory(formData: FormData) {
  const user = await requireUser();
  // Transações da categoria ficam "Sem categoria" (SetNull no banco).
  await db.category.deleteMany({ where: { id: String(formData.get("id")), userId: user.id } });
  refresh();
}
