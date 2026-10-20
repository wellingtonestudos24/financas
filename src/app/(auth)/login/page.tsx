import { signIn } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Entrar — Finanças" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Entrar</h1>
      <AuthForm mode="login" action={signIn} />
    </>
  );
}
