import { AccountForm } from "../account-form";

export const metadata = { title: "Nova conta — Finanças" };

export default function NewAccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nova conta</h1>
      <AccountForm initial={{ name: "", type: "CHECKING", color: "#0f766e", initialBalance: "0,00" }} />
    </div>
  );
}
