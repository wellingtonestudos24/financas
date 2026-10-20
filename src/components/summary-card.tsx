import type { LucideIcon } from "lucide-react";
import { formatCents } from "@/lib/money";

const TONES = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  teal: "bg-teal-100 text-teal-700",
} as const;

type Props = {
  label: string;
  cents: number;
  icon: LucideIcon;
  tone: keyof typeof TONES;
};

export function SummaryCard({ label, cents, icon: Icon, tone }: Props) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-full ${TONES[tone]}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className={`truncate text-xl font-semibold ${cents < 0 ? "text-red-600" : "text-slate-900"}`}>
          {formatCents(cents)}
        </p>
      </div>
    </div>
  );
}

export function SummarySkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card h-[84px] animate-pulse" />
      ))}
    </div>
  );
}
