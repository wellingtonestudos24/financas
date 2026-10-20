"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { dateToMonth, invoiceMonthFor, monthToDate } from "@/lib/cards";
import { db } from "@/lib/db";
import { monthKey, parseISODate, parseMonth } from "@/lib/dates";
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
    // "card:<id>" quando a despesa é no cartão de crédito.
    accountId: z.string().min(1, "Escolha a conta"),
    toAccountId: optionalId,
    categoryId: optionalId,
    paid: z.literal("on").optional(),
  })
  .refine((t) => t.type !== "TRANSFER" || (t.toAccountId && t.toAccountId !== t.accountId), {
    message: "Escolha uma conta de destino diferente da de origem",
  })
  .refine((t) => t.type === "EXPENSE" || !t.accountId.startsWith("card:"), {
    message: "Só despesas podem ser lançadas no cartão",
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
  const cardId = t.accountId.startsWith("card:") ? t.accountId.slice("card:".length) : null;

  // Tudo o que vem do formulário precisa pertencer ao usuário.
  let source: { accountId: string | null; creditCardId: string | null; invoiceMonth: Date | null };
  if (cardId) {
    const card = await db.creditCard.findFirst({ where: { id: cardId, userId: user.id } });
    if (!card) return { error: "Cartão não encontrado" };
    source = {
      accountId: null,
      creditCardId: card.id,
      invoiceMonth: monthToDate(invoiceMonthFor(t.date, card.closingDay)),
    };
  } else {
    const accountIds = [t.accountId, ...(isTransfer && t.toAccountId ? [t.toAccountId] : [])];
    const owned = await db.account.count({ where: { userId: user.id, id: { in: accountIds } } });
    if (owned !== new Set(accountIds).size) return { error: "Conta não encontrada" };
    source = { accountId: t.accountId, creditCardId: null, invoiceMonth: null };
  }
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
    // Compra no cartão é "paga" pela fatura; a situação fica na fatura, não na compra.
    paid: cardId ? true : t.paid === "on",
    ...source,
    toAccountId: isTransfer ? t.toAccountId : null,
    categoryId: isTransfer ? null : t.categoryId,
  };

  if (t.id) {
    const { count } = await db.transaction.updateMany({
      where: { id: t.id, userId: user.id, type: { not: "CARD_PAYMENT" } },
      data,
    });
    if (count === 0) return { error: "Transação não encontrada" };
  } else {
    await db.transaction.create({ data: { ...data, userId: user.id } });
  }
  if (cardId && source.invoiceMonth) {
    redirect(`/cartoes/${cardId}?fatura=${monthKey(dateToMonth(source.invoiceMonth))}`);
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

// ---------- Cartões de crédito ----------

const day = z.coerce.number().int().min(1, "Use um dia entre 1 e 28").max(28, "Use um dia entre 1 e 28");

const cardSchema = z.object({
  id: optionalId,
  name: z.string().trim().min(1, "Informe o nome do cartão"),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Cor inválida"),
  limit: money.refine((c) => c > 0, "O limite precisa ser maior que zero"),
  closingDay: day,
  dueDay: day,
  paymentAccountId: optionalId,
});

export async function saveCard(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = cardSchema.safeParse({ id: "", paymentAccountId: "", ...Object.fromEntries(formData) });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, ...data } = parsed.data;

  if (data.paymentAccountId) {
    const account = await db.account.findFirst({ where: { id: data.paymentAccountId, userId: user.id } });
    if (!account) return { error: "Conta não encontrada" };
  }

  // Mudar o fechamento não move compras antigas: o mês da fatura é fixado na compra.
  if (id) {
    const { count } = await db.creditCard.updateMany({ where: { id, userId: user.id }, data });
    if (count === 0) return { error: "Cartão não encontrado" };
  } else {
    await db.creditCard.create({ data: { ...data, userId: user.id } });
  }
  redirect("/cartoes");
}

export async function deleteCard(formData: FormData) {
  const user = await requireUser();
  // Apaga também compras e pagamentos de fatura do cartão (cascade no banco).
  await db.creditCard.deleteMany({ where: { id: String(formData.get("id")), userId: user.id } });
  redirect("/cartoes");
}

const paymentSchema = z.object({
  cardId: z.string().min(1),
  invoice: z.string().regex(/^\d{4}-\d{2}$/, "Fatura inválida"),
  accountId: z.string().min(1, "Escolha a conta"),
  amount: money.refine((c) => c > 0, "O valor precisa ser maior que zero"),
  date: isoDate,
});

export async function payInvoice(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  const [card, account] = await Promise.all([
    db.creditCard.findFirst({ where: { id: p.cardId, userId: user.id } }),
    db.account.findFirst({ where: { id: p.accountId, userId: user.id } }),
  ]);
  if (!card) return { error: "Cartão não encontrado" };
  if (!account) return { error: "Conta não encontrada" };

  const month = parseMonth(p.invoice);
  await db.transaction.create({
    data: {
      userId: user.id,
      type: "CARD_PAYMENT",
      description: `Fatura ${card.name}`,
      amount: p.amount,
      date: p.date,
      paid: true,
      accountId: account.id,
      creditCardId: card.id,
      invoiceMonth: monthToDate(month),
    },
  });
  refresh();
  return {};
}
