// Cria (ou recria) o usuário de demonstração com dados do mês atual.
// Uso: npm run db:seed   (login: demo@financas.test / demo-financas-123)
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_EMAIL, resetDemoUser } from "../src/lib/demo";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  await resetDemoUser(db);
  console.log(`Usuário de demonstração criado: ${DEMO_EMAIL}`);
}

main().finally(() => db.$disconnect());
