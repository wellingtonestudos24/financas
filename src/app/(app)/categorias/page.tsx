import { Suspense } from "react";
import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteCategory } from "../actions";
import { CategoryForm } from "./category-form";

export const metadata = { title: "Categorias — Finanças" };

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Categorias</h1>
      <Suspense fallback={<div className="card h-80 animate-pulse" />}>
        <Categories />
      </Suspense>
    </div>
  );
}

async function Categories() {
  const user = await requireUser();
  const categories = await db.category.findMany({
    where: { userId: user.id, type: { in: ["INCOME", "EXPENSE"] } },
    include: { _count: { select: { transactions: true } } },
    orderBy: { name: "asc" },
  });

  const groups = [
    { type: "EXPENSE" as const, title: "Despesas" },
    { type: "INCOME" as const, title: "Receitas" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {groups.map(({ type, title }) => (
        <section key={type} className="card flex flex-col gap-4">
          <h2 className="font-semibold">{title}</h2>
          <CategoryForm type={type} />
          <ul className="divide-y divide-slate-100">
            {categories
              .filter((c) => c.type === type)
              .map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2">
                  <span className="size-3 rounded-full" style={{ background: c.color }} />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-slate-400">
                    {c._count.transactions} {c._count.transactions === 1 ? "lançamento" : "lançamentos"}
                  </span>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="btn-ghost p-2 hover:text-red-600" title="Excluir categoria">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
