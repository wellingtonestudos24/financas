export const ACCOUNT_TYPES = {
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  WALLET: "Carteira",
  INVESTMENT: "Investimentos",
  OTHER: "Outra",
} as const;

// Tipos que o usuário lança pelo formulário de transação.
export const TRANSACTION_TYPES = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  TRANSFER: "Transferência",
} as const;

export type TransactionTypeKey = keyof typeof TRANSACTION_TYPES;

export function isTransactionType(value: unknown): value is TransactionTypeKey {
  return typeof value === "string" && value in TRANSACTION_TYPES;
}

// Inclui o pagamento de fatura, que nasce na tela do cartão.
export const ALL_TRANSACTION_TYPES = {
  ...TRANSACTION_TYPES,
  CARD_PAYMENT: "Pagamento de fatura",
} as const;

export function isAnyTransactionType(value: unknown): value is keyof typeof ALL_TRANSACTION_TYPES {
  return typeof value === "string" && value in ALL_TRANSACTION_TYPES;
}
