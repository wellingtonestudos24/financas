import { signUp } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Criar conta — Finanças" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Criar conta</h1>
      <AuthForm mode="cadastro" action={signUp} />
    </>
  );
}
