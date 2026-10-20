import { INVOICE_STATUS_LABEL, type InvoiceStatus } from "@/lib/cards";

const STYLES: Record<InvoiceStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  closed: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {INVOICE_STATUS_LABEL[status]}
    </span>
  );
}
