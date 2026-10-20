# O que falta no projeto

Situação em 20/10/2026. A lista segue a ordem sugerida de construção; cada item diz o que entra,
como saber que está pronto e o que muda no código.

## Já feito

- Login, cadastro e sessão em cookie criptografado.
- Contas com saldo inicial, saldo atual e saldo previsto no fim do mês.
- Categorias de receita e despesa com cor.
- Transações: receita, despesa e transferência, com situação efetivada/pendente, filtro por tipo e por mês.
- Cartões de crédito: limite, fechamento, vencimento, faturas abertas/fechadas/pagas, pagamento total ou parcial.
- Início: saldo, receitas, despesas, cartões a pagar, gráficos por categoria, contas, pendentes e faturas atuais.

---

## 1. Parcelamento e lançamentos repetidos

**O que entra**
- Compra parcelada no cartão: valor total + número de parcelas; cada parcela cai numa fatura seguida
  e aparece como "Tênis (2/10)".
- Despesas e receitas fixas (aluguel, salário, assinaturas) repetidas por N meses ou sem fim definido.
- Ao editar ou excluir um lançamento da série: "só este" ou "este e os próximos".

**Pronto quando**
- Uma compra de R$ 1.000 em 10x gera 10 lançamentos de R$ 100, um em cada fatura.
- Centavos que não dividem certo ficam na primeira parcela (ex.: R$ 100 em 3x = 33,34 + 33,33 + 33,33).
- O limite do cartão é consumido pelo total da compra no dia dela.

**No código**
- Novo modelo `Series` (id, frequência, total de parcelas) e em `Transaction`: `seriesId`, `installment`.
- Fixas sem fim: gerar lançamentos até 12 meses à frente e completar ao abrir meses futuros.
- `saveTransaction` e `deleteTransaction` ganham o escopo "este e os próximos".

## 2. Orçamentos

**O que entra**
- Valor planejado por categoria de despesa em cada mês.
- Barra planejado × gasto por categoria, com alerta ao passar de 80% e de 100%.
- "Copiar planejamento do mês anterior".
- Resumo: receitas do mês, gastos planejados, balanço planejado e % de economia planejada.

**Pronto quando**
- Gastos no cartão contam no orçamento pela data da compra (mesma regra das despesas do mês).
- Um mês sem planejamento mostra a opção de copiar do anterior.

**No código**
- Modelo `Budget` (userId, categoryId, mês, valor), único por usuário + categoria + mês.
- Nova rota `/orcamentos` e item no menu.

## 3. Relatórios

**O que entra**
- Evolução mensal de receitas × despesas (barras) nos últimos 6 ou 12 meses.
- Evolução do saldo total (linha).
- Despesas por categoria em um período escolhido (pizza), com detalhamento por categoria.
- Filtros por conta, cartão e categoria.

**Pronto quando**
- Os totais batem com a soma das telas de transações de cada mês.

**No código**
- Consultas agregadas por mês em `src/lib/reports.ts` (groupBy por mês no Postgres com `date_trunc`).
- Nova rota `/relatorios`, reaproveitando o Recharts já usado nos gráficos do início.

## 4. Melhorias nas telas existentes

- **Transações:** busca por descrição; filtros por conta, cartão e categoria; seleção em lote
  (efetivar, excluir, trocar categoria); paginação para meses com muitos lançamentos.
- **Contas:** arquivar conta sem apagar o histórico; gráfico de evolução do saldo; ajuste de saldo
  (lançamento de correção quando o saldo real diverge).
- **Cartões:** antecipar parcelas; estornos (compra com valor negativo que abate a fatura).
- **Início:** checklist de primeiros passos para quem acabou de criar a conta; escolher quais blocos aparecem.
- **Formulários:** confirmação antes de excluir; mensagens de sucesso após salvar.

## 5. Conta e configurações

- Editar nome, e-mail e senha.
- Recuperação de senha por e-mail (precisa de um serviço de envio, como Resend).
- Tema escuro.
- Exportar dados (CSV) e excluir a conta com todos os dados.
- Importar extrato (OFX ou CSV do banco) com revisão antes de salvar.

## 6. Publicar online

- Hospedagem do app (Vercel) e de um Postgres gerenciado (Neon, Supabase ou Vercel Postgres).
- Variáveis `DATABASE_URL` e `SESSION_PASSWORD` no provedor; `prisma migrate deploy` no deploy.
- Domínio próprio (opcional) e HTTPS (já vem da hospedagem).
- Backup automático do banco (vem com os Postgres gerenciados; conferir a retenção).

## 7. Qualidade e segurança

- **Testes:** unitários para as regras de dinheiro e datas (`money.ts`, `dates.ts`, `cards.ts`:
  fechamento, vencimento, virada de ano) e de ponta a ponta com Playwright para login, lançamento
  e pagamento de fatura.
- **CI:** GitHub Actions rodando lint, tipos, testes e build a cada push.
- **Login:** limitar tentativas por e-mail/IP para evitar força bruta.
- **Sessão:** invalidar sessões ao trocar a senha (hoje o cookie vale por 30 dias).
- **Dados:** índices conferidos quando houver volume; paginação nas listas longas.

---

## Fora do escopo por enquanto

- **Sincronização bancária automática** (Open Finance): exige credenciamento ou um agregador pago
  (Pluggy, Belvo). Vale reavaliar depois do app publicado.
- **App mobile nativo:** o layout já é responsivo; um PWA (instalável no celular) resolve antes.
- **Planos pagos e multiusuário/família.**
