import { Badge } from "@/components/ui-kit/badge";
import type { OrderStatus } from "@/db/schema";

const tone: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  paid: "bg-emerald-100 text-emerald-900 border-emerald-200",
  processing: "bg-sky-100 text-sky-900 border-sky-200",
  shipped: "bg-indigo-100 text-indigo-900 border-indigo-200",
  completed: "bg-neutral-200 text-neutral-900 border-neutral-300",
  cancelled: "bg-neutral-100 text-neutral-600 border-neutral-200",
  refunded: "bg-rose-100 text-rose-900 border-rose-200",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={tone[status]}>
      {status}
    </Badge>
  );
}
