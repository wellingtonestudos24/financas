import { signIn, signInDemo } from "../actions";
import { AuthForm } from "../auth-form";
import { DemoButton } from "../demo-button";

export const metadata = { title: "Entrar — Finanças" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Entrar</h1>
      <AuthForm mode="login" action={signIn} />

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        ou
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <form action={signInDemo}>
        <DemoButton />
      </form>
      <p className="mt-2 text-center text-xs text-slate-500">
        Conta com dados de exemplo, recriados a cada acesso.
      </p>
    </>
  );
}
