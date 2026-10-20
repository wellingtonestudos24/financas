import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { sealData, unsealData } from "iron-session";

export const SESSION_COOKIE = "financas_session";
const TTL_SECONDS = 60 * 60 * 24 * 30;

type SessionData = { userId?: string };

function password() {
  const value = process.env.SESSION_PASSWORD;
  if (!value || value.length < 32) {
    throw new Error("SESSION_PASSWORD precisa ter pelo menos 32 caracteres");
  }
  return value;
}

export async function getSessionUserId(): Promise<string | undefined> {
  // unsealData compara a validade com a hora atual, então a leitura é sempre por requisição.
  await connection();
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return undefined;
  const data = await unsealData<SessionData>(cookie, {
    password: password(),
    ttl: TTL_SECONDS,
  });
  return data.userId;
}

export async function startSession(userId: string) {
  const seal = await sealData({ userId } satisfies SessionData, {
    password: password(),
    ttl: TTL_SECONDS,
  });
  (await cookies()).set(SESSION_COOKIE, seal, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
