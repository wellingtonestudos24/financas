import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getSessionUserId } from "./session";

export type CurrentUser = { id: string; name: string; email: string };

// Camada de acesso: toda página e server action passa por aqui.
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) redirect("/login");
  return user;
});
