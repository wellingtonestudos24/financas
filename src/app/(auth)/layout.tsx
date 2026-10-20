import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2 text-teal-700">
          <Wallet className="size-7" />
          <span className="text-xl font-semibold">Finanças</span>
        </div>
        {children}
      </div>
    </main>
  );
}
