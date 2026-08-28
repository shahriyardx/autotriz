"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { orderStatuses, type OrderStatus } from "@/db/schema";
import { api } from "@/trpc/react";

export function OrderStatusSelect({
  id,
  status,
}: {
  id: string;
  status: OrderStatus;
}) {
  const router = useRouter();

  const setStatus = api.order.setStatus.useMutation({
    onSuccess: (_data, variables) => {
      toast.success(`Marked as ${variables.status}`);
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <label className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Status</span>
      <select
        defaultValue={status}
        disabled={setStatus.isPending}
        onChange={(event) =>
          setStatus.mutate({
            id,
            status: event.target.value as OrderStatus,
          })
        }
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm capitalize shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {orderStatuses.map((value) => (
          <option key={value} value={value} className="capitalize">
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}
