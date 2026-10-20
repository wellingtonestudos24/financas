"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCents } from "@/lib/money";

type Slice = { name: string; color: string; total: number };

export function CategoryChart({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="flex flex-col items-center gap-4 xl:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCents(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex w-full min-w-0 flex-col gap-2 text-sm">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            <span className="text-slate-500">{Math.round((d.total / total) * 100)}%</span>
            <span className="text-right font-medium whitespace-nowrap">{formatCents(d.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
