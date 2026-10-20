import { NextResponse, type NextRequest } from "next/server";

// Checagem otimista: só olha se o cookie existe. A validação real fica em requireUser().
const SESSION_COOKIE = "financas_session";
const PUBLIC_PATHS = ["/login", "/cadastro"];

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isPublic = PUBLIC_PATHS.includes(request.nextUrl.pathname);

  // Não redireciona quem tem cookie para fora do login: um cookie expirado causaria loop.
  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
