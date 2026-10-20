"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Home, Landmark, Tags, Wallet } from "lucide-react";

const LINKS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/contas", label: "Contas", icon: Landmark },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/categorias", label: "Categorias", icon: Tags },
] as const;

const VARIANTS = {
  side: {
    link: "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
    active: "bg-teal-50 text-teal-800",
    idle: "text-slate-600 hover:bg-slate-100",
  },
  bottom: {
    link: "flex flex-col items-center gap-1 py-2 text-xs",
    active: "text-teal-700",
    idle: "text-slate-500",
  },
} as const;

type Variant = keyof typeof VARIANTS;

function Links({ variant, pathname }: { variant: Variant; pathname?: string }) {
  const styles = VARIANTS[variant];
  const isActive = (href: string) =>
    pathname !== undefined && (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return LINKS.map(({ href, label, icon: Icon }) => (
    <Link key={href} href={href} className={`${styles.link} ${isActive(href) ? styles.active : styles.idle}`}>
      <Icon className="size-5" />
      {label}
    </Link>
  ));
}

function ActiveLinks({ variant }: { variant: Variant }) {
  return <Links variant={variant} pathname={usePathname()} />;
}

// O caminho atual só existe em tempo de requisição; o menu é pré-renderizado sem destaque
// e o item ativo aparece quando o Suspense resolve.
function NavLinks({ variant }: { variant: Variant }) {
  return (
    <Suspense fallback={<Links variant={variant} />}>
      <ActiveLinks variant={variant} />
    </Suspense>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2 text-teal-700">
        <Wallet className="size-6" />
        <span className="text-lg font-semibold">Finanças</span>
      </div>
      <NavLinks variant="side" />
    </aside>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-slate-200 bg-white md:hidden">
      <NavLinks variant="bottom" />
    </nav>
  );
}
