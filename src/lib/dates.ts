// Datas de transação são dias de calendário (coluna DATE), tratadas em UTC.

export type Month = { year: number; month: number }; // month: 1-12

const TIME_ZONE = "America/Sao_Paulo";

export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

export function parseISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function currentMonth(): Month {
  const [year, month] = todayISO().split("-").map(Number);
  return { year, month };
}

export function parseMonth(value: string | string[] | undefined): Month {
  if (typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return { year, month };
  }
  return currentMonth();
}

export function monthKey({ year, month }: Month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function shiftMonth({ year, month }: Month, delta: number): Month {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

// Intervalo [início, fim) do mês em UTC.
export function monthRange(m: Month) {
  const next = shiftMonth(m, 1);
  return {
    start: new Date(Date.UTC(m.year, m.month - 1, 1)),
    end: new Date(Date.UTC(next.year, next.month - 1, 1)),
  };
}

export function monthLabel({ year, month }: Month) {
  const name = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

export function formatDay(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(date);
}
