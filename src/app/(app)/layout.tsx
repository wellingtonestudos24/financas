import { Suspense } from "react";
import { BottomNav, Sidebar } from "@/components/nav";
import { UserMenu } from "@/components/user-menu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-end px-4 md:px-8">
          <Suspense fallback={<div className="size-9 animate-pulse rounded-full bg-slate-200" />}>
            <UserMenu />
          </Suspense>
        </header>
        <main className="flex-1 px-4 pb-24 md:px-8 md:pb-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
