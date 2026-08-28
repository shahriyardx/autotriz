"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { addressInput } from "@/lib/checkout";
import { COUNTRY, DISTRICTS, upazilasIn } from "@/lib/bangladesh";
import { cn } from "@/lib/cn";

/* The customer's saved delivery addresses. One is the default, which is
   what the checkout fills in for them. */

const schema = z.object({ label: z.string().trim().max(60).optional(), address: addressInput });
type Values = z.infer<typeof schema>;

const inputClass =
  "mt-3 w-full border-b border-border bg-transparent pb-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

export function AddressBook() {
  const utils = api.useUtils();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const list = api.account.addresses.useQuery();

  const done = (message: string) => {
    toast.success(message);
    setAdding(false);
    setEditing(null);
    void utils.account.addresses.invalidate();
  };
  const fail = (error: { message: string }) => toast.error(error.message);

  const save = api.account.saveAddress.useMutation({ onSuccess: () => done("Address saved"), onError: fail });
  const remove = api.account.deleteAddress.useMutation({ onSuccess: () => done("Address removed"), onError: fail });
  const setDefault = api.account.setDefaultAddress.useMutation({
    onSuccess: () => done("Default address updated"),
    onError: fail,
  });

  const addresses = list.data ?? [];

  return (
    <div className="space-y-6">
      {addresses.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((entry) => (
            <li key={entry.id} className="border border-border p-6">
              {editing === entry.id ? (
                <AddressForm
                  initial={{ label: entry.label ?? "", address: entry.address as Values["address"] }}
                  pending={save.isPending}
                  onCancel={() => setEditing(null)}
                  onSubmit={(values) => save.mutate({ id: entry.id, ...values })}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="label text-muted-foreground">
                      {entry.label ?? "Address"}
                    </p>
                    {entry.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-sm border border-primary px-2 py-0.5 text-xs text-primary">
                        <Star className="h-3 w-3" />
                        Default
                      </span>
                    ) : null}
                  </div>

                  <address className="mt-4 not-italic leading-relaxed text-foreground/75">
                    {entry.address.name}
                    <br />
                    {entry.address.line1}
                    {entry.address.line2 ? (
                      <>
                        <br />
                        {entry.address.line2}
                      </>
                    ) : null}
                    <br />
                    {entry.address.city}
                    {entry.address.region ? `, ${entry.address.region}` : ""}
                    {entry.address.postcode ? ` ${entry.address.postcode}` : ""}
                    <br />
                    {entry.address.country}
                    {entry.address.phone ? (
                      <>
                        <br />
                        {entry.address.phone}
                      </>
                    ) : null}
                  </address>

                  <div className="mt-5 flex flex-wrap gap-4 text-sm">
                    <button
                      type="button"
                      onClick={() => setEditing(entry.id)}
                      className="underline decoration-primary underline-offset-4"
                    >
                      Edit
                    </button>
                    {!entry.isDefault ? (
                      <button
                        type="button"
                        onClick={() => setDefault.mutate({ id: entry.id })}
                        className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
                      >
                        Make default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => remove.mutate({ id: entry.id })}
                      className="inline-flex items-center gap-1 text-destructive underline underline-offset-4"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : list.isLoading ? (
        <p className="text-foreground/75">Loading…</p>
      ) : (
        <div className="border border-dashed border-border py-14 text-center">
          <MapPin className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-4 text-foreground/75">No saved addresses yet.</p>
        </div>
      )}

      {adding ? (
        <div className="border border-border p-6">
          <p className="label mb-5 text-muted-foreground">New address</p>
          <AddressForm
            pending={save.isPending}
            onCancel={() => setAdding(false)}
            onSubmit={(values) => save.mutate(values)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="label inline-flex items-center gap-2 border-2 border-foreground px-6 py-3.5 transition-colors hover:bg-foreground hover:text-background"
        >
          <Plus className="h-4 w-4" />
          Add an address
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AddressForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: Values;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: Values) => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? {
      label: "",
      address: {
        name: "",
        phone: "",
        line1: "",
        line2: "",
        region: "",
        city: "",
        postcode: "",
        country: COUNTRY,
      },
    },
  });

  const district = form.watch("address.region");

  /** A linked dropdown: division narrows district, district narrows upazila. */
  const select = (
    name: "address.region" | "address.city",
    label: string,
    placeholder: string,
    options: string[],
    disabled?: boolean,
    onPick?: () => void,
  ) => {
    const id = `addr-${name.replace(/\./g, "-")}`;
    const registered = form.register(name);
    const error = name
      .split(".")
      .reduce<unknown>(
        (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
        form.formState.errors as unknown,
      ) as { message?: string } | undefined;

    return (
      <div key={name}>
        <label htmlFor={id} className="label text-muted-foreground">
          {label}
        </label>
        <select
          id={id}
          disabled={disabled}
          {...registered}
          onChange={(event) => {
            void registered.onChange(event);
            onPick?.();
          }}
          className={cn(
            "mt-3 w-full border-b border-border bg-transparent pb-3 text-foreground outline-none transition-colors focus:border-primary disabled:opacity-50",
            error && "border-destructive",
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {error?.message ? <p className="mt-2 text-xs text-destructive">{error.message}</p> : null}
      </div>
    );
  };

  const field = (name: string, label: string, optional?: boolean) => {
    const id = `addr-${name.replace(/\./g, "-")}`;
    const error = name
      .split(".")
      .reduce<unknown>(
        (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
        form.formState.errors as unknown,
      ) as { message?: string } | undefined;

    return (
      <div key={name}>
        <label htmlFor={id} className="label text-muted-foreground">
          {label}
          {optional ? <span className="ml-2 normal-case tracking-normal opacity-60">optional</span> : null}
        </label>
        <input id={id} className={cn(inputClass, error && "border-destructive")} {...form.register(name as never)} />
        {error?.message ? <p className="mt-2 text-xs text-destructive">{error.message}</p> : null}
      </div>
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {field("label", "Label", true)}
      {field("address.name", "Full name")}
      {field("address.phone", "Phone", true)}
      {field("address.line1", "Street address")}
      {field("address.line2", "Apartment, floor, landmark", true)}

      <div className="grid gap-5 sm:grid-cols-2">
        {select("address.region", "District", "Choose a district", DISTRICTS, false, () =>
          form.setValue("address.city", ""),
        )}
        {select(
          "address.city",
          "Upazila / thana",
          district ? "Choose an upazila" : "Choose a district first",
          upazilasIn(district),
          !district,
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {field("address.postcode", "Post code", true)}
        {field("address.country", "Country")}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="label flex items-center gap-3 bg-foreground px-6 py-3.5 text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="label px-6 py-3.5 text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
