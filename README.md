# Finanças

App web de finanças pessoais: contas bancárias, receitas, despesas, transferências, categorias,
cartões de crédito com faturas e um painel mensal com saldos e gráficos.

Feito com Next.js 16, Prisma 7 + PostgreSQL e Tailwind CSS 4.

- Como o código funciona e as regras de negócio: [docs/ARQUITETURA.md](docs/ARQUITETURA.md)
- O que falta construir: [ROADMAP.md](ROADMAP.md)
- Instruções para agentes de IA: [AGENTS.md](AGENTS.md)

## Passo a passo para iniciar

### 1. Instale os pré-requisitos (uma vez só)

| Programa | Versão | Como conferir | Onde baixar |
|---|---|---|---|
| Git | qualquer | `git --version` | https://git-scm.com |
| Node.js | 22 ou mais nova | `node -v` | https://nodejs.org (ou `nvm install 22`) |
| Docker Desktop | qualquer | `docker -v` | https://www.docker.com/products/docker-desktop |

O Docker roda o banco de dados. Deixe o Docker Desktop **aberto** sempre que for usar o app.

### 2. Baixe o projeto

```bash
git clone https://github.com/wellingtonestudos24/financas.git
cd financas
```

### 3. Crie o arquivo de configuração `.env`

```bash
cp .env.example .env
```

Gere uma senha para a sessão de login:

```bash
openssl rand -hex 32
```

Abra o `.env` e cole o resultado entre as aspas de `SESSION_PASSWORD`. O `DATABASE_URL` já vem
pronto para o banco local e não precisa mudar. O `.env` nunca vai para o Git.

### 4. Instale as dependências

```bash
npm install
```

Isso também gera o client do Prisma em `src/generated/prisma`.

### 5. Suba o banco de dados

```bash
npm run db:up
```

Cria um container `financas_postgres` com o Postgres na porta **5433**. Para conferir se está no
ar: `docker ps` deve listar `financas_postgres`.

### 6. Crie as tabelas

```bash
npm run db:deploy
```

Aplica todas as migrações de `prisma/migrations`.

### 7. (Opcional) Carregue dados de exemplo

```bash
npm run db:seed
```

Cria o usuário de demonstração com contas, transações e um cartão:

- e-mail: `demo@financas.test`
- senha: `demo-financas-123`

Rodar de novo apaga e recria só esse usuário.

### 8. Inicie o app

```bash
npm run dev
```

Abra http://localhost:3000. Entre com o usuário de demonstração ou clique em **Criar conta**.
Toda conta nova já vem com uma "Carteira" e categorias padrão.

## No dia a dia

Para usar de novo depois de desligar o computador:

1. Abra o Docker Desktop.
2. Na pasta do projeto: `npm run db:up` e depois `npm run dev`.

Para parar: `Ctrl+C` no terminal do `npm run dev`. O banco pode ficar ligado; para desligar,
use `docker compose stop`. Os dados ficam guardados num volume do Docker e não se perdem.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o app em modo desenvolvimento (http://localhost:3000) |
| `npm run db:up` | Sobe o banco no Docker |
| `npm run db:deploy` | Aplica as migrações pendentes |
| `npm run db:migrate -- --name <nome>` | Cria uma migração nova depois de mudar `prisma/schema.prisma` |
| `npm run db:seed` | Recria o usuário de demonstração |
| `npm run typecheck` | Confere os tipos do TypeScript |
| `npm run lint` | Confere o padrão do código |
| `npm run build` | Gera a versão de produção (também detecta erros) |
| `npm start` | Roda a versão de produção depois do `build` |

## Problemas comuns

- **`Can't reach database server at localhost:5433`**: o Docker Desktop está fechado ou o banco
  não subiu. Abra o Docker e rode `npm run db:up`.
- **`port is already allocated` ao subir o banco**: outro programa usa a porta 5433. Troque
  `"5433:5432"` no `docker-compose.yaml` e a porta no `DATABASE_URL` do `.env`.
- **`SESSION_PASSWORD precisa ter pelo menos 32 caracteres`**: falta o passo 3.
- **Porta 3000 ocupada**: rode `npm run dev -- -p 3001` e abra http://localhost:3001.
- **Erro dizendo que um modelo do Prisma não existe**, depois de puxar mudanças: rode
  `npm install`, `npm run db:deploy` e reinicie o `npm run dev`.
- **Caiu na tela de login sem motivo**: a sessão expirou ou o usuário foi recriado pelo seed.
  Entre de novo.

## Publicado na Vercel

- **App:** Vercel, importado do GitHub. Cada push na `main` gera um deploy novo.
- **Banco:** Prisma Postgres, ligado pela aba Storage da Vercel com o prefixo `DATABASE`. Isso cria
  o `DATABASE_URL` sozinho. O `SESSION_PASSWORD` é configurado à mão em Settings → Environment Variables.
- **Build Command:** `prisma migrate deploy && next build`, em Settings → Build and Deployment. Assim as
  migrações novas são aplicadas no banco de produção a cada deploy.
- **Conta demo:** o botão "Entrar como demonstração" da tela de login recria os dados de exemplo e
  entra direto. Para recriar pelo terminal: `DATABASE_URL="<url de produção>" npm run db:seed`.
