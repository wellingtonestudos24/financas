export const ACCOUNT_TYPES = {
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  WALLET: "Carteira",
  INVESTMENT: "Investimentos",
  OTHER: "Outra",
} as const;

export const TRANSACTION_TYPES = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  TRANSFER: "Transferência",
} as const;

export type TransactionTypeKey = keyof typeof TRANSACTION_TYPES;

export function isTransactionType(value: unknown): value is TransactionTypeKey {
  return typeof value === "string" && value in TRANSACTION_TYPES;
}
