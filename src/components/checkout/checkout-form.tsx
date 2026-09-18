"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Banknote, Loader2, Lock } from "lucide-react";
import { api } from "@/trpc/react";
import { useCart } from "@/components/cart/cart-context";
import { checkoutInput, PAYMENT_METHOD } from "@/lib/checkout";
import { COUNTRY, formatPrice } from "@/lib/shop-config";
import { Button } from "@/components/ui-kit/button";
import { Checkbox } from "@/components/ui-kit/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui-kit/field";
import { Input } from "@/components/ui-kit/input";
import { Textarea } from "@/components/ui-kit/textarea";

/* ==================================================================
   Checkout.

   One schema, shared with the server. The browser sends slugs and
   counts; every price shown here is worked out server-side, and worked
   out again when the order is placed.
   ================================================================== */

type Values = z.input<typeof checkoutInput>;
type Name = FieldPath<Values>;

export function CheckoutForm({
  signedIn,
  defaults,
}: {
  signedIn: boolean;
  defaults: {
    email: string;
    name: string;
    phone: string;
    address: Partial<Values["shipping"]> | null;
  };
}) {
  const router = useRouter();
  const { items, clear, ready } = useCart();
  const [failed, setFailed] = useState<string | null>(null);

  const lines = items.map((i) => ({ slug: i.slug, quantity: i.quantity }));
  const quote = api.checkout.quote.useQuery({ lines }, { enabled: ready && lines.length > 0 });

  /* The code is checked as a query so the panel can show what it is
     worth before the order exists. The server judges it again when the
     order is placed — this is a preview, not a decision. */
  const [codeDraft, setCodeDraft] = useState("");
  const [applied, setApplied] = useState<string | null>(null);

  const discount = api.discount.check.useQuery(
    { code: applied ?? "", subtotal: quote.data?.subtotal ?? 0 },
    { enabled: Boolean(applied) && Boolean(quote.data) },
  );

  const form = useForm<Values>({
    resolver: zodResolver(checkoutInput),
    mode: "onTouched",
    defaultValues: {
      lines,
      email: defaults.email,
      phone: defaults.phone,
      shipping: {
        name: defaults.address?.name ?? defaults.name,
        phone: defaults.address?.phone ?? defaults.phone,
        line1: defaults.address?.line1 ?? "",
        line2: defaults.address?.line2 ?? "",
        region: defaults.address?.region ?? "",
        city: defaults.address?.city ?? "",
        postcode: defaults.address?.postcode ?? "",
        country: COUNTRY,
      },
      billingSameAsShipping: true,
      billing: { name: "", line1: "", region: "", city: "", country: COUNTRY },
      notes: "",
      paymentMethod: "cod",
      createAccount: false,
      password: "",
      saveAddress: signedIn,
    },
  });

  const place = api.checkout.place.useMutation({
    onSuccess: ({ number }) => {
      clear();
      router.push(`/order/${number}`);
    },
    onError: (error) => setFailed(error.message),
  });

  const sameBilling = form.watch("billingSameAsShipping");
  const createAccount = form.watch("createAccount");

  if (!ready) {
    return <p className="label py-20 text-muted-foreground">Loading your cart…</p>;
  }

  if (!items.length) {
    return (
      <div className="border-t border-foreground py-20">
        <p className="display text-3xl">Your cart is empty</p>
        <Link href="/shop" className="label mt-8 inline-block border-b border-primary pb-1">
          Browse the range →
        </Link>
      </div>
    );
  }

  const summary = quote.data;
  const off = discount.data?.ok ? discount.data.amount : 0;

  const control = form.control;

  return (
    <form
      onSubmit={form.handleSubmit(
        (values) => {
          setFailed(null);
          place.mutate({
            ...values,
            lines,
            billing: values.billingSameAsShipping ? undefined : values.billing,
            discountCode: discount.data?.ok ? applied ?? undefined : undefined,
          });
        },
        () => setFailed("Some details are missing. Check the fields marked below."),
      )}
      className="grid gap-14 lg:grid-cols-12"
    >
      {/* ============================ FORM ============================ */}
      <div className="space-y-12 lg:col-span-7">
        {/* ---------------- contact ---------------- */}
        <section>
          <SectionHead step="01" title="Contact" />

          {!signedIn ? (
            <p className="mb-6 text-sm text-foreground/75">
              Already have an account?{" "}
              <Link
                href="/account/login?next=/checkout"
                className="underline decoration-primary underline-offset-4"
              >
                Sign in
              </Link>{" "}
              and your details fill themselves in.
            </p>
          ) : null}

          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField control={control} name="email" label="Email address" type="email" autoComplete="email" />
              <TextField control={control} name="phone" label="Phone number" type="tel" autoComplete="tel" />
            </div>

            {!signedIn ? (
              <div className="space-y-5 rounded-lg border p-5">
                <Controller
                  name="createAccount"
                  control={control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id={field.name}
                        checked={Boolean(field.value)}
                        onCheckedChange={(on) => field.onChange(on === true)}
                      />
                      <div className="flex-1">
                        <FieldLabel htmlFor={field.name}>Create an account</FieldLabel>
                        <FieldDescription>
                          Track this order and check out faster next time.
                        </FieldDescription>
                      </div>
                    </Field>
                  )}
                />
                {createAccount ? (
                  <TextField
                    control={control}
                    name="password"
                    label="Choose a password"
                    type="password"
                    autoComplete="new-password"
                    help="At least 10 characters."
                  />
                ) : null}
              </div>
            ) : null}
          </FieldGroup>
        </section>

        {/* ---------------- delivery ---------------- */}
        <section>
          <SectionHead step="02" title="Delivery address" />
          <AddressFields control={control} prefix="shipping" />

          <FieldGroup className="mt-7">
            <Controller
              name="billingSameAsShipping"
              control={control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id={field.name}
                    checked={Boolean(field.value)}
                    onCheckedChange={(on) => field.onChange(on === true)}
                  />
                  <FieldLabel htmlFor={field.name} className="font-normal">
                    Billing address is the same
                  </FieldLabel>
                </Field>
              )}
            />

            {signedIn ? (
              <Controller
                name="saveAddress"
                control={control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox
                      id={field.name}
                      checked={Boolean(field.value)}
                      onCheckedChange={(on) => field.onChange(on === true)}
                    />
                    <FieldLabel htmlFor={field.name} className="font-normal">
                      Save this address to my account
                    </FieldLabel>
                  </Field>
                )}
              />
            ) : null}
          </FieldGroup>

          {!sameBilling ? (
            <div className="mt-8 rounded-lg border p-5">
              <p className="label mb-5 text-muted-foreground">Billing address</p>
              <AddressFields control={control} prefix="billing" />
            </div>
          ) : null}
        </section>

        {/* ---------------- payment ---------------- */}
        <section>
          <SectionHead step="03" title="Payment" />

          <FieldGroup>
            {/* One way to pay, so this states it rather than asking.
                The value is still submitted with the order. */}
            <div className="flex items-start gap-3 border border-border bg-muted/40 p-5">
              <Banknote className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">{PAYMENT_METHOD.label}</p>
                <FieldDescription>{PAYMENT_METHOD.description}</FieldDescription>
              </div>
            </div>

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Order notes</FieldLabel>
                  <Textarea
                    id={field.name}
                    rows={3}
                    placeholder="Delivery instructions, a landmark, a preferred time…"
                    {...field}
                    value={(field.value as string) ?? ""}
                  />
                  <FieldDescription>Optional.</FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>
        </section>
      </div>

      {/* ============================ SUMMARY ============================ */}
      <aside className="lg:col-span-5">
        <div className="lg:sticky lg:top-32">
          <p className="label text-muted-foreground">Your order</p>

          <ul className="mt-6 divide-y divide-border border-y border-border">
            {(summary?.lines ?? []).map((line) => (
              <li key={line.slug} className="flex items-center gap-4 py-4">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden bg-muted">
                  {line.image ? (
                    <Image src={line.image} alt="" fill sizes="64px" className="object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{line.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {line.sku}
                    {line.size ? ` · ${line.size}` : ""} · {line.quantity} ×{" "}
                    {formatPrice(line.unitPrice)}
                  </span>
                  {!line.available ? (
                    <span className="mt-1 block text-xs text-destructive">Out of stock</span>
                  ) : null}
                </span>
                <span className="tabular-nums">{formatPrice(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>

          {/* --- discount code --- */}
          <div className="mt-6 border-t border-border pt-6">
            {applied && discount.data?.ok ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="label text-primary">{applied}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {discount.data.label} applied
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setApplied(null);
                    setCodeDraft("");
                  }}
                  className="label text-muted-foreground underline-offset-4 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  aria-label="Discount code"
                  placeholder="Discount code"
                  value={codeDraft}
                  onChange={(event) => setCodeDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    if (codeDraft.trim()) setApplied(codeDraft.trim().toUpperCase());
                  }}
                  className="w-full rounded-sm border border-border bg-background px-4 py-3 font-mono text-sm uppercase outline-none transition-colors focus:border-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!codeDraft.trim()}
                  onClick={() => setApplied(codeDraft.trim().toUpperCase())}
                >
                  Apply
                </Button>
              </div>
            )}

            {applied && discount.data && !discount.data.ok ? (
              <p className="mt-2 text-xs text-destructive" role="alert">
                {discount.data.reason}
              </p>
            ) : null}
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Subtotal" value={formatPrice(summary?.subtotal ?? 0)} />
            {off ? <Row label={`Discount (${applied})`} value={`− ${formatPrice(off)}`} /> : null}
            <Row label="Delivery" value={summary?.shipping ? formatPrice(summary.shipping) : "Free"} />
            <div className="flex items-baseline justify-between border-t border-border pt-4">
              <dt className="display text-base">Total</dt>
              <dd className="display text-2xl tabular-nums">
                {formatPrice(Math.max(0, (summary?.total ?? 0) - off))}
              </dd>
            </div>
          </dl>

          {failed ? (
            <p
              role="alert"
              className="mt-6 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {failed}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={place.isPending || quote.isLoading}
            className="mt-8 w-full"
          >
            {place.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Place order
          </Button>

          <p className="mt-4 text-xs text-muted-foreground">
            By placing this order you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/return-refund-policy" className="underline underline-offset-2">
              returns policy
            </Link>
            .
          </p>
        </div>
      </aside>
    </form>
  );
}

/* ==================================================================
   Address — district and upazila are the pair a courier in Bangladesh
   actually needs. Both are typed rather than chosen: a picker of
   sixty-four districts, each narrowing a second picker, was more work
   than writing the name of the place you live.
   ================================================================== */

function AddressFields({
  control,
  prefix,
}: {
  control: Control<Values>;
  prefix: "shipping" | "billing";
}) {
  return (
    <FieldGroup>
      <TextField control={control} name={`${prefix}.name` as Name} label="Full name" autoComplete="name" />
      <TextField
        control={control}
        name={`${prefix}.line1` as Name}
        label="Street address"
        placeholder="House, road, area"
        autoComplete="address-line1"
      />
      <TextField
        control={control}
        name={`${prefix}.line2` as Name}
        label="Apartment, floor, landmark"
        optional
        autoComplete="address-line2"
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField
          control={control}
          name={`${prefix}.region` as Name}
          label="District"
          placeholder="Dhaka"
          autoComplete="address-level1"
        />
        <TextField
          control={control}
          name={`${prefix}.city` as Name}
          label="Upazila / thana"
          placeholder="Gulshan"
          autoComplete="address-level2"
        />
      </div>

      {/* Country is not asked for: the shop delivers within Bangladesh
          and nowhere else. It is still sent with the address, so the
          order records where it went. */}
      <TextField
        control={control}
        name={`${prefix}.postcode` as Name}
        label="Post code"
        optional
        autoComplete="postal-code"
      />
    </FieldGroup>
  );
}

/* ------------------------------------------------------------------ */

function TextField({
  control,
  name,
  label,
  type = "text",
  optional,
  help,
  placeholder,
  autoComplete,
}: {
  control: Control<Values>;
  name: Name;
  label: string;
  type?: string;
  optional?: boolean;
  help?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>
            {label}
            {optional ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">optional</span>
            ) : null}
          </FieldLabel>
          <Input
            id={field.name}
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
            {...field}
            value={(field.value as string) ?? ""}
          />
          {help && !fieldState.invalid ? <FieldDescription>{help}</FieldDescription> : null}
          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}

/* ------------------------------------------------------------------ */

function SectionHead({ step, title }: { step: string; title: string }) {
  return (
    <div className="mb-7 flex items-baseline gap-4 border-b border-border pb-4">
      <span className="display text-primary">{step}</span>
      <h2 className="display text-lg">{title}</h2>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-foreground/75">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
