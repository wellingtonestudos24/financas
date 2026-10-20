import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthKey, monthLabel, shiftMonth, type Month } from "@/lib/dates";

type Props = { month: Month; basePath: string; param?: string };

export function MonthNav({ month, basePath, param = "mes" }: Props) {
  const href = (m: Month) => `${basePath}?${param}=${monthKey(m)}`;
  return (
    <div className="flex items-center justify-center gap-2">
      <Link href={href(shiftMonth(month, -1))} className="btn-ghost" aria-label="Mês anterior">
        <ChevronLeft className="size-5" />
      </Link>
      <span className="min-w-40 rounded-full border border-teal-700 px-4 py-1.5 text-center font-medium text-teal-800">
        {monthLabel(month)}
      </span>
      <Link href={href(shiftMonth(month, 1))} className="btn-ghost" aria-label="Próximo mês">
        <ChevronRight className="size-5" />
      </Link>
    </div>
  );
}
