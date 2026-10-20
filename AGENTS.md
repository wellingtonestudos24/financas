# Finanças — instruções para agentes de IA

App web de finanças pessoais (contas, transações, categorias, cartões e faturas) em Next.js 16,
Prisma 7 e PostgreSQL. Interface e textos em português (pt-BR).

Antes de mudar código, leia:
- [docs/ARQUITETURA.md](docs/ARQUITETURA.md): estrutura, modelo de dados, regras de saldo e de
  fatura, padrões obrigatórios e armadilhas.
- [ROADMAP.md](ROADMAP.md): o que falta construir, na ordem sugerida, com critérios de pronto.

## Comandos

- `npm run db:up`: sobe o Postgres (Docker, porta 5433).
- `npm run db:migrate -- --name <nome>`: cria e aplica migração após mudar `prisma/schema.prisma`.
- `npm run db:seed`: recria o usuário demo (`demo@financas.test` / `demo-financas-123`).
- `npm run dev`: servidor de desenvolvimento. Reinicie após mudar o schema do Prisma.
- `npm run typecheck`, `npm run lint`, `npm run build`: rode os três antes de entregar.

## Regras que não podem ser quebradas

- Toda página que lê dados e toda server action começa com `await requireUser()` e filtra por
  `userId`. Updates e deletes usam `updateMany`/`deleteMany` com `{ id, userId }`.
- Dinheiro em centavos (`Int`). Datas de transação com `parseISODate("AAAA-MM-DD")` (meia-noite UTC).
- Leituras de cookie, `params`, `searchParams` ou hora atual ficam dentro de `<Suspense>`
  (Cache Components ligado). Siga o padrão das páginas existentes.
- Mutações ficam em `src/app/(app)/actions.ts` e validam a entrada com zod.
- Não atualize o Prisma para a 8 (a tag `latest` é um RC) e não edite migrações já aplicadas.
- Não commite `.env`, `src/generated/` nem `.next/`.
- Pagamento de fatura (`CARD_PAYMENT`) nunca conta como despesa; compra no cartão nunca mexe em conta.

## Como validar uma mudança

Sem testes automatizados por enquanto. Rode `typecheck`, `lint` e `build`, depois teste o fluxo no
navegador com o usuário demo e confira os totais à mão (saldo, despesas do mês, fatura).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
