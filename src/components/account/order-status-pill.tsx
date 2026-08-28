import { cn } from "@/lib/cn";

/** One colour per order state, shared by every customer-facing list. */
const TONES: Record<string, string> = {
  pending: "border-amber-500/40 text-amber-700 dark:text-amber-400",
  paid: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
  processing: "border-sky-500/40 text-sky-700 dark:text-sky-400",
  shipped: "border-indigo-500/40 text-indigo-700 dark:text-indigo-400",
  completed: "border-border text-foreground",
  cancelled: "border-border text-muted-foreground",
  refunded: "border-rose-500/40 text-rose-700 dark:text-rose-400",
};

export function OrderStatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-sm border px-2 py-0.5 text-xs font-medium capitalize",
        TONES[status] ?? "border-border text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}
