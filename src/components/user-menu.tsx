import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";

export async function UserMenu() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-800">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <span className="hidden text-sm font-medium text-slate-700 sm:inline">{user.name}</span>
      <form action={signOut}>
        <button className="btn-ghost" title="Sair">
          <LogOut className="size-4" />
          <span className="sr-only">Sair</span>
        </button>
      </form>
    </div>
  );
}
