"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui-kit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-kit/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui-kit/dialog";
import { api } from "@/trpc/react";

export function ProductRowActions({
  id,
  slug,
  name,
  active,
}: {
  id: string;
  slug: string;
  name: string;
  active: boolean;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const [confirming, setConfirming] = useState(false);

  const setActive = api.product.setActive.useMutation({
    onSuccess: () => {
      toast.success(active ? "Hidden from the shop" : "Published");
      utils.product.list.invalidate();
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const remove = api.product.delete.useMutation({
    onSuccess: () => {
      setConfirming(false);
      toast.success(`${name} deleted`);
      utils.product.list.invalidate();
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${name}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/products/${id}`}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/products/${slug}`} target="_blank" rel="noreferrer">
              View on site
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setActive.mutate({ id, active: !active })}
          >
            {active ? "Hide from shop" : "Publish"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirming(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {name}?</DialogTitle>
            <DialogDescription>
              This removes the product from the catalogue for good. Past orders
              keep their own copy of the name and price, so order history is not
              affected. If you only want it off the shop, hide it instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate({ id })}
            >
              {remove.isPending ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
