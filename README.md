# Finanças

App de controle financeiro pessoal: contas, categorias, receitas, despesas, transferências e um painel mensal com saldos e gráficos por categoria.

Feito com Next.js 16 (App Router, Server Actions), Prisma 7 + PostgreSQL e Tailwind CSS 4.

## Rodando localmente

Requisitos: Node.js 22+, Docker.

```bash
cp .env.example .env          # e preencha SESSION_PASSWORD (openssl rand -hex 32)
npm install
npm run db:up                 # Postgres na porta 5433
npm run db:migrate
npm run db:seed               # opcional: usuário demo@financas.test / demo-financas-123
npm run dev
```

Abra http://localhost:3000 e crie sua conta (ou entre com o usuário demo).

## Estrutura

- `prisma/schema.prisma` — modelos: User, Account, Category, Transaction (valores em centavos).
- `src/lib/` — sessão (cookie criptografado com iron-session), acesso ao banco e cálculos de saldo.
- `src/app/(auth)` — login e cadastro.
- `src/app/(app)` — telas autenticadas e `actions.ts` com todas as mutações (sempre checam o dono do registro).
- `src/proxy.ts` — redireciona para o login quem não tem cookie de sessão.

## Regras de saldo

- **Saldo atual**: saldo inicial + transações efetivadas com data até hoje.
- **Saldo previsto**: inclui pendentes e lançamentos até o fim do mês selecionado.
- Transferências saem da conta de origem e entram na de destino; não contam como receita nem despesa.
