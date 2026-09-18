"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/server/api/root";
import { discountInput, discountTypes } from "@/lib/discounts";
import { currency, formatPrice } from "@/lib/shop-config";
import { Badge } from "@/components/ui-kit/badge";
import { Button } from "@/components/ui-kit/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui-kit/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui-kit/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui-kit/field";
import { Input } from "@/components/ui-kit/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui-kit/select";
import { Switch } from "@/components/ui-kit/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui-kit/table";

/* Exactly the row the router returns, so the server's first render and
   the client's refetch are the same shape. */
type Row = RouterOutputs["discount"]["list"][number];

type Values = z.input<typeof discountInput>;

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time. */
const forInput = (date: Date | null) => {
  if (!date) return null;
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function DiscountManager({ initial }: { initial: Row[] }) {
  const rows = api.discount.list.useQuery(undefined, { initialData: initial });
  const utils = api.useUtils();

  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Row | null>(null);

  const refresh = () => utils.discount.list.invalidate();

  const setActive = api.discount.setActive.useMutation({
    onSuccess: () => refresh(),
    onError: (error) => toast.error(error.message),
  });

  const remove = api.discount.remove.useMutation({
    onSuccess: () => {
      toast.success("Code deleted");
      setRemoving(null);
      void refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const list = rows.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} discount {list.length === 1 ? "code" : "codes"}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          New code
        </Button>
      </div>

      {list.length ? (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Takes off</TableHead>
                <TableHead>Minimum</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Window</TableHead>
                <TableHead className="text-right">Live</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono font-medium">{row.code}</TableCell>
                  <TableCell>
                    {row.type === "percent"
                      ? `${Number(row.value)}%`
                      : formatPrice(Number(row.value))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.minSubtotal ? formatPrice(row.minSubtotal) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.usedCount}
                    {row.usageLimit === null ? "" : ` / ${row.usageLimit}`}
                    {row.usageLimit !== null && row.usedCount >= row.usageLimit ? (
                      <Badge variant="secondary" className="ml-2">
                        Spent
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <Window from={row.startsAt} to={row.endsAt} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={row.active}
                      aria-label={`${row.active ? "Pause" : "Resume"} ${row.code}`}
                      onCheckedChange={(active) => setActive.mutate({ id: row.id, active })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${row.code}`}
                        onClick={() => setEditing(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${row.code}`}
                        className="text-destructive"
                        onClick={() => setRemoving(row)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-background p-14 text-center">
          <p className="font-medium">No discount codes yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            A code takes a percentage or a fixed amount off the goods in an
            order. Shipping is never discounted.
          </p>
          <Button className="mt-6" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            New code
          </Button>
        </div>
      )}

      <DiscountDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={() => {
          setCreating(false);
          void refresh();
        }}
      />

      <DiscountDialog
        key={editing?.id}
        row={editing ?? undefined}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void refresh();
        }}
      />

      <AlertDialog open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {removing?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Orders already placed with it keep their discount. Nobody will be
              able to use it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removing && remove.mutate({ id: removing.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Window({ from, to }: { from: Date | null; to: Date | null }) {
  const show = (date: Date) => new Date(date).toLocaleDateString();
  if (!from && !to) return <span>Always</span>;
  if (from && to) return <span>{show(from)} – {show(to)}</span>;
  if (from) return <span>From {show(from)}</span>;
  return <span>Until {show(to!)}</span>;
}

/* ------------------------------------------------------------------ */

function DiscountDialog({
  row,
  open,
  onOpenChange,
  onSaved,
}: {
  row?: Row;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(discountInput),
    defaultValues: row
      ? {
          code: row.code,
          type: row.type,
          // Stored in minor units; shown in taka.
          value: row.type === "percent" ? Number(row.value) : Number(row.value) / 100,
          minSubtotal: row.minSubtotal / 100,
          usageLimit: row.usageLimit,
          startsAt: forInput(row.startsAt),
          endsAt: forInput(row.endsAt),
          active: row.active,
        }
      : {
          code: "",
          type: "percent",
          value: 10,
          minSubtotal: 0,
          usageLimit: null,
          startsAt: null,
          endsAt: null,
          active: true,
        },
  });

  const type = form.watch("type");

  const onError = (error: { message: string }) => toast.error(error.message);
  const create = api.discount.create.useMutation({
    onSuccess: () => {
      toast.success("Code created");
      form.reset();
      onSaved();
    },
    onError,
  });
  const update = api.discount.update.useMutation({
    onSuccess: () => {
      toast.success("Code saved");
      onSaved();
    },
    onError,
  });

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row ? `Edit ${row.code}` : "New discount code"}</DialogTitle>
          <DialogDescription>
            Takes money off the goods in an order. Shipping is never discounted.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) =>
            row ? update.mutate({ ...values, id: row.id }) : create.mutate(values),
          )}
          className="space-y-5"
        >
          <Controller
            name="code"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Code</FieldLabel>
                <Input
                  id={field.name}
                  placeholder="EID25"
                  className="font-mono uppercase"
                  aria-invalid={fieldState.invalid}
                  {...field}
                  value={(field.value as string) ?? ""}
                />
                <FieldDescription>
                  Case does not matter — it is stored and matched in capitals.
                </FieldDescription>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Kind</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {discountTypes.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option === "percent" ? "Percentage off" : "Amount off"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <NumberField
              control={form.control}
              name="value"
              label={type === "percent" ? "Percentage" : `Amount (${currency.symbol})`}
              step={type === "percent" ? 1 : 0.01}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              control={form.control}
              name="minSubtotal"
              label={`Minimum order (${currency.symbol})`}
              step={0.01}
              help="Leave at zero for no minimum."
            />
            <NumberField
              control={form.control}
              name="usageLimit"
              label="Total uses"
              step={1}
              nullable
              help="Empty means unlimited."
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <DateField control={form.control} name="startsAt" label="Starts" />
            <DateField control={form.control} name="endsAt" label="Ends" />
          </div>

          <Controller
            name="active"
            control={form.control}
            render={({ field }) => (
              <Field orientation="horizontal" className="items-start">
                <Switch
                  id={field.name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <div>
                  <FieldLabel htmlFor={field.name} className="font-normal">
                    Accept this code
                  </FieldLabel>
                  <FieldDescription>
                    Turn it off to stop it working without deleting it.
                  </FieldDescription>
                </div>
              </Field>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {row ? "Save changes" : "Create code"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

type Control = ReturnType<typeof useForm<Values>>["control"];

function NumberField({
  control,
  name,
  label,
  step,
  help,
  nullable,
}: {
  control: Control;
  name: "value" | "minSubtotal" | "usageLimit";
  label: string;
  step: number;
  help?: string;
  nullable?: boolean;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            id={field.name}
            type="number"
            step={step}
            min={0}
            aria-invalid={fieldState.invalid}
            value={field.value === null || field.value === undefined ? "" : String(field.value)}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") return field.onChange(nullable ? null : 0);
              field.onChange(Number(raw));
            }}
            onBlur={field.onBlur}
          />
          {help && !fieldState.invalid ? <FieldDescription>{help}</FieldDescription> : null}
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}

function DateField({
  control,
  name,
  label,
}: {
  control: Control;
  name: "startsAt" | "endsAt";
  label: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={field.name}>
            {label}
            <span className="ml-2 text-xs font-normal text-muted-foreground">optional</span>
          </FieldLabel>
          <Input
            id={field.name}
            type="datetime-local"
            value={(field.value as string | null) ?? ""}
            onChange={(event) => field.onChange(event.target.value || null)}
            onBlur={field.onBlur}
          />
        </Field>
      )}
    />
  );
}
