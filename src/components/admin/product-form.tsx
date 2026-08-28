"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Box,
  ChevronDown,
  ChevronRight,
  ImageUp,
  Library,
  Link2,
  Loader2,
  Package,
  Plus,
  Settings2,
  Star,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { api } from "@/trpc/react";
import type { products } from "@/db/schema";
import type { ProductInput } from "@/server/api/schemas";
import { ImageManager } from "@/components/admin/image-manager";
import { MediaPicker } from "@/components/admin/media/media-library";
import { IMAGE_ACCEPT, useMediaUpload } from "@/components/admin/media/use-upload";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { Badge } from "@/components/ui-kit/badge";
import { Button } from "@/components/ui-kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-kit/card";
import { Checkbox } from "@/components/ui-kit/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui-kit/field";
import { Input } from "@/components/ui-kit/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui-kit/select";
import { Switch } from "@/components/ui-kit/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui-kit/tabs";
import { Textarea } from "@/components/ui-kit/textarea";
import { cn } from "@/lib/cn";

/* ==================================================================
   Schema — every text input is held as a string and converted once,
   on submit, into the shape `productInput` expects. The browser checks
   the shape of the form; the server checks the shape of the data.
   ================================================================== */

const money = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0),
    "Must be a positive amount",
  );

const whole = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0),
    "Must be a whole number",
  );

const decimal = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0),
    "Must be a positive number",
  );

const attributeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  valuesText: z.string().trim().min(1, "Add at least one value"),
  visible: z.boolean(),
});

const formSchema = z
  .object({
    /* General */
    name: z.string().trim().min(2, "Name is too short"),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lower-case words separated by hyphens"),
    price: money.refine((v) => v !== "", "Regular price is required"),
    salePrice: money,
    saleScheduled: z.boolean(),
    saleStartsAt: z.string(),
    saleEndsAt: z.string(),
    taxStatus: z.enum(["taxable", "shipping", "none"]),
    taxClass: z.string().trim().min(1, "Required"),
    surface: z.string().trim().min(1, "Surface is required"),
    size: z.string().trim(),
    featuresText: z.string(),
    shortDescription: z.string(),
    description: z.string(),
    /* Inventory */
    sku: z.string().trim().min(1, "SKU is required"),
    gtin: z.string().trim(),
    trackStock: z.boolean(),
    stock: whole,
    lowStockAt: whole,
    backorders: z.enum(["no", "notify", "yes"]),
    stockStatus: z.enum(["instock", "outofstock", "onbackorder"]),
    soldIndividually: z.boolean(),
    /* Shipping */
    weight: decimal,
    length: decimal,
    width: decimal,
    height: decimal,
    shippingClass: z.string().trim(),
    /* Linked */
    upsellIds: z.array(z.string()),
    crossSellIds: z.array(z.string()),
    /* Attributes */
    attributes: z.array(attributeSchema),
    /* Advanced */
    purchaseNote: z.string(),
    sortOrder: z
      .string()
      .trim()
      .refine((v) => Number.isInteger(Number(v)), "Must be a whole number"),
    reviewsEnabled: z.boolean(),
    /* Publish */
    active: z.boolean(),
    catalogVisibility: z.enum(["visible", "catalog", "search", "hidden"]),
    featured: z.boolean(),
    /* Organisation */
    categoryId: z.string().uuid("Pick a primary category"),
    categoryIds: z.array(z.string()),
    tags: z.array(z.string()),
  })
  .refine((f) => f.salePrice === "" || Number(f.salePrice) < Number(f.price), {
    path: ["salePrice"],
    message: "Sale price must be lower than the regular price",
  })
  .refine(
    (f) =>
      !f.saleScheduled ||
      !f.saleStartsAt ||
      !f.saleEndsAt ||
      new Date(f.saleStartsAt) <= new Date(f.saleEndsAt),
    { path: ["saleEndsAt"], message: "Sale must end after it starts" },
  )
  .refine((f) => !f.trackStock || f.stock !== "", {
    path: ["stock"],
    message: "Stock quantity is required when stock is tracked",
  });

type FormValues = z.infer<typeof formSchema>;

export type ProductFormProduct = typeof products.$inferSelect & { categoryIds: string[] };

/* ==================================================================
   Helpers
   ================================================================== */

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const fromMinor = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : (value / 100).toFixed(2);

const numOrNull = (value: string) => (value.trim() === "" ? null : Number(value));
const textOrNull = (value: string) => (value.trim() === "" ? null : value.trim());
const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(date: Date | null | undefined) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const TAX_STATUSES = [
  { value: "taxable", label: "Taxable" },
  { value: "shipping", label: "Shipping only" },
  { value: "none", label: "None" },
] as const;

const TAX_CLASSES = ["standard", "reduced-rate", "zero-rate"] as const;

const BACKORDERS = [
  { value: "no", label: "Do not allow" },
  { value: "notify", label: "Allow, but notify customer" },
  { value: "yes", label: "Allow" },
] as const;

const STOCK_STATUSES = [
  { value: "instock", label: "In stock" },
  { value: "outofstock", label: "Out of stock" },
  { value: "onbackorder", label: "On backorder" },
] as const;

const VISIBILITIES = [
  { value: "visible", label: "Shop and search results" },
  { value: "catalog", label: "Shop only" },
  { value: "search", label: "Search results only" },
  { value: "hidden", label: "Hidden" },
] as const;

const SHIPPING_CLASSES = ["", "small-parcel", "bulky", "hazardous"] as const;

/* ==================================================================
   The form
   ================================================================== */

export function ProductForm({ product }: { product?: ProductFormProduct }) {
  const router = useRouter();
  // A new product has no id to hang images off yet, so uploads are held
  // here and attached the moment it is created.
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const attach = api.media.attachToProduct.useMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      price: product ? fromMinor(product.price) : "",
      salePrice: fromMinor(product?.salePrice),
      saleScheduled: Boolean(product?.saleStartsAt || product?.saleEndsAt),
      saleStartsAt: toLocalInput(product?.saleStartsAt),
      saleEndsAt: toLocalInput(product?.saleEndsAt),
      taxStatus: product?.taxStatus ?? "taxable",
      taxClass: product?.taxClass ?? "standard",
      surface: product?.surface ?? "Paint",
      size: product?.size ?? "",
      featuresText: (product?.features ?? []).join("\n"),
      shortDescription: product?.shortDescription ?? "",
      description: product?.description ?? "",
      sku: product?.sku ?? "",
      gtin: product?.gtin ?? "",
      trackStock: product?.trackStock ?? true,
      stock: String(product?.stock ?? 0),
      lowStockAt: String(product?.lowStockAt ?? 5),
      backorders: product?.backorders ?? "no",
      stockStatus: product?.stockStatus ?? "instock",
      soldIndividually: product?.soldIndividually ?? false,
      weight: product?.weight?.toString() ?? "",
      length: product?.length?.toString() ?? "",
      width: product?.width?.toString() ?? "",
      height: product?.height?.toString() ?? "",
      shippingClass: product?.shippingClass ?? "",
      upsellIds: product?.upsellIds ?? [],
      crossSellIds: product?.crossSellIds ?? [],
      attributes: (product?.attributes ?? []).map((a) => ({
        name: a.name,
        valuesText: a.values.join(" | "),
        visible: a.visible,
      })),
      purchaseNote: product?.purchaseNote ?? "",
      sortOrder: String(product?.sortOrder ?? 0),
      reviewsEnabled: product?.reviewsEnabled ?? true,
      active: product?.active ?? true,
      catalogVisibility: product?.catalogVisibility ?? "visible",
      featured: product?.featured ?? false,
      categoryId: product?.categoryId ?? "",
      categoryIds: product?.categoryIds ?? [],
      tags: product?.tags ?? [],
    },
  });

  // A new product gets its slug from its name until the slug is edited
  // by hand — after which we stop interfering.
  const name = useWatch({ control: form.control, name: "name" });
  useEffect(() => {
    if (product) return;
    if (form.getFieldState("slug").isDirty) return;
    form.setValue("slug", slugify(name ?? ""));
  }, [name, product, form]);

  const onError = (error: { message: string }) => toast.error(error.message);
  const onDone = (message: string) => {
    toast.success(message);
    router.push("/admin/products");
    router.refresh();
  };

  const create = api.product.create.useMutation({
    onSuccess: async (row) => {
      for (const image of pendingImages) {
        try {
          await attach.mutateAsync({ productId: row.id, key: image.key, alt: null });
        } catch {
          toast.error(`Could not attach ${image.name}`);
        }
      }
      onDone("Product created");
    },
    onError,
  });
  const update = api.product.update.useMutation({
    onSuccess: () => onDone("Changes saved"),
    onError,
  });

  const saving = create.isPending || update.isPending || attach.isPending;

  function onSubmit(values: FormValues) {
    const payload: ProductInput = {
      name: values.name,
      slug: values.slug,
      categoryId: values.categoryId,
      categoryIds: values.categoryIds,
      surface: values.surface,
      shortDescription: values.shortDescription,
      description: values.description,
      price: Number(values.price),
      salePrice: numOrNull(values.salePrice),
      saleStartsAt:
        values.saleScheduled && values.saleStartsAt ? new Date(values.saleStartsAt) : null,
      saleEndsAt:
        values.saleScheduled && values.saleEndsAt ? new Date(values.saleEndsAt) : null,
      taxStatus: values.taxStatus,
      taxClass: values.taxClass,
      size: textOrNull(values.size),
      image: product?.image ?? pendingImages[0]?.url ?? null,
      features: lines(values.featuresText),
      sku: values.sku,
      gtin: textOrNull(values.gtin),
      trackStock: values.trackStock,
      stock: values.stock === "" ? 0 : Number(values.stock),
      lowStockAt: values.lowStockAt === "" ? 0 : Number(values.lowStockAt),
      backorders: values.backorders,
      stockStatus: values.stockStatus,
      soldIndividually: values.soldIndividually,
      weight: numOrNull(values.weight),
      length: numOrNull(values.length),
      width: numOrNull(values.width),
      height: numOrNull(values.height),
      shippingClass: textOrNull(values.shippingClass),
      upsellIds: values.upsellIds,
      crossSellIds: values.crossSellIds,
      attributes: values.attributes.map((a) => ({
        name: a.name,
        values: a.valuesText
          .split("|")
          .map((v) => v.trim())
          .filter(Boolean),
        visible: a.visible,
      })),
      tags: values.tags,
      purchaseNote: textOrNull(values.purchaseNote),
      reviewsEnabled: values.reviewsEnabled,
      sortOrder: Number(values.sortOrder),
      active: values.active,
      catalogVisibility: values.catalogVisibility,
      featured: values.featured,
    };

    if (product) update.mutate({ ...payload, id: product.id });
    else create.mutate(payload);
  }

  // Jump to the tab that holds the first invalid field.
  const [tab, setTab] = useState("general");
  function onInvalid(errors: Record<string, unknown>) {
    const keys = Object.keys(errors);
    const tabFor: Record<string, string> = {
      sku: "inventory",
      gtin: "inventory",
      stock: "inventory",
      lowStockAt: "inventory",
      weight: "shipping",
      length: "shipping",
      width: "shipping",
      height: "shipping",
      attributes: "attributes",
      sortOrder: "advanced",
      purchaseNote: "advanced",
    };
    const target = keys.map((k) => tabFor[k]).find(Boolean);
    if (target) setTab(target);
    toast.error("Some fields need attention");
  }

  const trackStock = useWatch({ control: form.control, name: "trackStock" });
  const saleScheduled = useWatch({ control: form.control, name: "saleScheduled" });
  const salePrice = useWatch({ control: form.control, name: "salePrice" });

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]"
    >
      {/* ============================ MAIN ============================ */}
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-5">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Product name</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="3D Matrix Pro"
                    className="text-base"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="shortDescription"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Short description</FieldLabel>
                  <Textarea
                    id={field.name}
                    rows={3}
                    placeholder="One or two sentences shown next to the price."
                    {...field}
                  />
                  <FieldDescription>
                    Shown under the price and used as the search teaser. Leave
                    empty to fall back to the start of the description.
                  </FieldDescription>
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <MarkdownEditor
                    id={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={fieldState.invalid}
                    placeholder="The full write-up shown on the product page."
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </CardContent>
        </Card>

        {/* ---------------------- Product data ---------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Product data</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab} orientation="vertical" className="gap-6 md:flex-row">
              <TabsList variant="line" className="w-full shrink-0 md:w-44">
                <DataTab value="general" icon={Package} label="General" />
                <DataTab value="inventory" icon={Box} label="Inventory" />
                <DataTab value="shipping" icon={Truck} label="Shipping" />
                <DataTab value="linked" icon={Link2} label="Linked products" />
                <DataTab value="attributes" icon={Tag} label="Attributes" />
                <DataTab value="advanced" icon={Settings2} label="Advanced" />
              </TabsList>

              {/* -------------------- General -------------------- */}
              <TabsContent value="general" className="flex-1 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Controller
                    name="price"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Regular price (৳)</FieldLabel>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          aria-invalid={fieldState.invalid}
                          {...field}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="salePrice"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Sale price (৳)</FieldLabel>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          placeholder="Leave empty for no sale"
                          aria-invalid={fieldState.invalid}
                          {...field}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="saleScheduled"
                  control={form.control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id={field.name}
                        checked={field.value}
                        disabled={salePrice.trim() === ""}
                        onCheckedChange={(on) => field.onChange(on === true)}
                      />
                      <FieldLabel htmlFor={field.name} className="font-normal">
                        Schedule the sale
                      </FieldLabel>
                    </Field>
                  )}
                />

                {saleScheduled && salePrice.trim() !== "" ? (
                  <div className="grid gap-5 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                    <Controller
                      name="saleStartsAt"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>Sale starts</FieldLabel>
                          <Input id={field.name} type="datetime-local" {...field} />
                          <FieldDescription>Empty means straight away.</FieldDescription>
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      name="saleEndsAt"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>Sale ends</FieldLabel>
                          <Input id={field.name} type="datetime-local" {...field} />
                          <FieldDescription>Empty means until you stop it.</FieldDescription>
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Controller
                    name="taxStatus"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Tax status</FieldLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id={field.name} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_STATUSES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                  <Controller
                    name="taxClass"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Tax class</FieldLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id={field.name} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_CLASSES.map((t) => (
                              <SelectItem key={t} value={t} className="capitalize">
                                {t.replace("-", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Controller
                    name="surface"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Intended surface</FieldLabel>
                        <Input
                          id={field.name}
                          placeholder="Paint"
                          aria-invalid={fieldState.invalid}
                          {...field}
                        />
                        <FieldDescription>Drives the surface filter in the shop.</FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="size"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Pack size</FieldLabel>
                        <Input id={field.name} placeholder="50 ml" {...field} />
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="featuresText"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Feature list</FieldLabel>
                      <Textarea id={field.name} rows={4} {...field} />
                      <FieldDescription>One per line. Shown as bullets on the product page.</FieldDescription>
                    </Field>
                  )}
                />
              </TabsContent>

              {/* -------------------- Inventory -------------------- */}
              <TabsContent value="inventory" className="flex-1 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Controller
                    name="sku"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>SKU</FieldLabel>
                        <Input
                          id={field.name}
                          placeholder="AT-V1P-50"
                          aria-invalid={fieldState.invalid}
                          {...field}
                        />
                        <FieldDescription>Stock keeping unit — must be unique.</FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="gtin"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>GTIN, UPC, EAN or ISBN</FieldLabel>
                        <Input id={field.name} placeholder="Optional" {...field} />
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="trackStock"
                  control={form.control}
                  render={({ field }) => (
                    <Field orientation="horizontal" className="rounded-lg border p-4">
                      <div className="flex-1 space-y-0.5">
                        <FieldLabel htmlFor={field.name}>Track stock quantity</FieldLabel>
                        <FieldDescription>
                          Count units on hand and stop selling when they run out.
                        </FieldDescription>
                      </div>
                      <Switch
                        id={field.name}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </Field>
                  )}
                />

                {trackStock ? (
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Controller
                      name="stock"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>Quantity</FieldLabel>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            step="1"
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      name="lowStockAt"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>Low stock threshold</FieldLabel>
                          <Input
                            id={field.name}
                            type="number"
                            min="0"
                            step="1"
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      name="backorders"
                      control={form.control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>Allow backorders?</FieldLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id={field.name} className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BACKORDERS.map((b) => (
                                <SelectItem key={b.value} value={b.value}>
                                  {b.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    />
                  </div>
                ) : (
                  <Controller
                    name="stockStatus"
                    control={form.control}
                    render={({ field }) => (
                      <Field className="sm:max-w-xs">
                        <FieldLabel htmlFor={field.name}>Stock status</FieldLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id={field.name} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STOCK_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                )}

                <Controller
                  name="soldIndividually"
                  control={form.control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id={field.name}
                        checked={field.value}
                        onCheckedChange={(on) => field.onChange(on === true)}
                      />
                      <div>
                        <FieldLabel htmlFor={field.name} className="font-normal">
                          Sold individually
                        </FieldLabel>
                        <FieldDescription>Limit purchases to one item per order.</FieldDescription>
                      </div>
                    </Field>
                  )}
                />
              </TabsContent>

              {/* -------------------- Shipping -------------------- */}
              <TabsContent value="shipping" className="flex-1 space-y-5">
                <Controller
                  name="weight"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="sm:max-w-xs">
                      <FieldLabel htmlFor={field.name}>Weight (kg)</FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="0.000"
                        aria-invalid={fieldState.invalid}
                        {...field}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <div>
                  <p className="mb-2 text-sm font-medium">Dimensions (cm)</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(["length", "width", "height"] as const).map((dim) => (
                      <Controller
                        key={dim}
                        name={dim}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <Input
                              id={field.name}
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder={dim[0].toUpperCase() + dim.slice(1)}
                              aria-label={dim}
                              aria-invalid={fieldState.invalid}
                              {...field}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <Controller
                  name="shippingClass"
                  control={form.control}
                  render={({ field }) => (
                    <Field className="sm:max-w-xs">
                      <FieldLabel htmlFor={field.name}>Shipping class</FieldLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                        value={field.value || "__none__"}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIPPING_CLASSES.map((c) => (
                            <SelectItem key={c || "none"} value={c || "__none__"} className="capitalize">
                              {c ? c.replace("-", " ") : "No shipping class"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        Groups products that ship the same way, for rate rules later.
                      </FieldDescription>
                    </Field>
                  )}
                />
              </TabsContent>

              {/* -------------------- Linked -------------------- */}
              <TabsContent value="linked" className="flex-1 space-y-6">
                <Controller
                  name="upsellIds"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Upsells</FieldLabel>
                      <ProductPicker
                        value={field.value}
                        onChange={field.onChange}
                        exclude={product?.id}
                      />
                      <FieldDescription>
                        Products you recommend instead of the one being viewed — a
                        bigger pack, the pro grade.
                      </FieldDescription>
                    </Field>
                  )}
                />
                <Controller
                  name="crossSellIds"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Cross-sells</FieldLabel>
                      <ProductPicker
                        value={field.value}
                        onChange={field.onChange}
                        exclude={product?.id}
                      />
                      <FieldDescription>
                        Products promoted in the cart alongside this one — the
                        applicator, the panel wipe.
                      </FieldDescription>
                    </Field>
                  )}
                />
              </TabsContent>

              {/* -------------------- Attributes -------------------- */}
              <TabsContent value="attributes" className="flex-1">
                <AttributesEditor control={form.control} />
              </TabsContent>

              {/* -------------------- Advanced -------------------- */}
              <TabsContent value="advanced" className="flex-1 space-y-5">
                <Controller
                  name="purchaseNote"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Purchase note</FieldLabel>
                      <Textarea id={field.name} rows={3} {...field} />
                      <FieldDescription>
                        Sent to the customer after they buy — application tips, a cure time.
                      </FieldDescription>
                    </Field>
                  )}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Controller
                    name="sortOrder"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Menu order</FieldLabel>
                        <Input
                          id={field.name}
                          type="number"
                          step="1"
                          aria-invalid={fieldState.invalid}
                          {...field}
                        />
                        <FieldDescription>Lower numbers come first in the shop.</FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="reviewsEnabled"
                    control={form.control}
                    render={({ field }) => (
                      <Field orientation="horizontal" className="rounded-lg border p-4 sm:mt-6">
                        <FieldLabel htmlFor={field.name}>Enable reviews</FieldLabel>
                        <Switch
                          id={field.name}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </Field>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* ============================ SIDEBAR ============================ */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Controller
              name="active"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <div className="flex-1">
                    <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                    <FieldDescription>{field.value ? "Published" : "Draft"}</FieldDescription>
                  </div>
                  <Switch
                    id={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
            <Controller
              name="catalogVisibility"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Catalogue visibility</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBILITIES.map((v) => (
                        <SelectItem key={v.value} value={v.value}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              name="featured"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id={field.name}
                    checked={field.value}
                    onCheckedChange={(on) => field.onChange(on === true)}
                  />
                  <FieldLabel htmlFor={field.name} className="font-normal">
                    This is a featured product
                  </FieldLabel>
                </Field>
              )}
            />

            <Controller
              name="slug"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Permalink</FieldLabel>
                  <Input id={field.name} aria-invalid={fieldState.invalid} {...field} />
                  <FieldDescription className="break-all">
                    /products/{form.watch("slug") || "…"}
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="flex gap-3 border-t pt-5">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {product ? "Update" : "Publish"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/products">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product categories</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryTreePicker control={form.control} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product tags</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              name="tags"
              control={form.control}
              render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product images</CardTitle>
          </CardHeader>
          <CardContent>
            {product ? (
              <ImageManager productId={product.id} />
            ) : (
              <PendingImages value={pendingImages} onChange={setPendingImages} />
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

/* ==================================================================
   Pieces
   ================================================================== */

function DataTab({
  value,
  icon: Icon,
  label,
}: {
  value: string;
  icon: typeof Package;
  label: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className="w-full justify-start gap-2 data-[state=active]:bg-muted data-[state=active]:shadow-none"
    >
      <Icon className="h-4 w-4" />
      {label}
    </TabsTrigger>
  );
}

/* ---------------- Categories: nested checkboxes + primary ---------------- */

type CategoryOption = { id: string; name: string; parentId: string | null; active: boolean };
type CategoryNode = CategoryOption & { children: CategoryNode[] };

function toTree(rows: CategoryOption[]): CategoryNode[] {
  const byParent = new Map<string | null, CategoryOption[]>();
  for (const row of rows) {
    const list = byParent.get(row.parentId) ?? [];
    list.push(row);
    byParent.set(row.parentId, list);
  }
  const walk = (parentId: string | null): CategoryNode[] =>
    (byParent.get(parentId) ?? []).map((row) => ({ ...row, children: walk(row.id) }));
  return walk(null);
}

function CategoryTreePicker({ control }: { control: Control<FormValues> }) {
  const options = api.product.categoryOptions.useQuery();
  const tree = useMemo(() => toTree(options.data ?? []), [options.data]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  return (
    <Controller
      name="categoryIds"
      control={control}
      render={({ field: extras }) => (
        <Controller
          name="categoryId"
          control={control}
          render={({ field: primary, fieldState }) => {
            const chosen = new Set([primary.value, ...extras.value].filter(Boolean));

            function toggle(id: string, on: boolean) {
              const next = new Set(chosen);
              if (on) next.add(id);
              else next.delete(id);

              // The primary category is always one of the chosen ones.
              let nextPrimary = primary.value;
              if (!next.has(nextPrimary)) nextPrimary = next.values().next().value ?? "";
              if (!nextPrimary && on) nextPrimary = id;

              primary.onChange(nextPrimary);
              extras.onChange(Array.from(next).filter((c) => c !== nextPrimary));
            }

            const renderNodes = (nodes: CategoryNode[], depth: number) =>
              nodes.map((node) => (
                <li key={node.id}>
                  <div
                    className="flex items-center gap-2 py-1"
                    style={{ paddingLeft: depth * 16 }}
                  >
                    {node.children.length ? (
                      <button
                        type="button"
                        className="grid size-4 place-items-center text-muted-foreground"
                        onClick={() =>
                          setCollapsed((prev) => {
                            const next = new Set(prev);
                            if (next.has(node.id)) next.delete(node.id);
                            else next.add(node.id);
                            return next;
                          })
                        }
                        aria-label="Toggle"
                      >
                        {collapsed.has(node.id) ? (
                          <ChevronRight className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    ) : null}
                    <Checkbox
                      id={`cat-${node.id}`}
                      checked={chosen.has(node.id)}
                      onCheckedChange={(on) => toggle(node.id, on === true)}
                    />
                    <label
                      htmlFor={`cat-${node.id}`}
                      className={cn("flex-1 text-sm", !node.active && "text-muted-foreground")}
                    >
                      {node.name}
                    </label>
                    {chosen.has(node.id) ? (
                      <button
                        type="button"
                        onClick={() => {
                          const others = Array.from(chosen).filter((c) => c !== node.id);
                          primary.onChange(node.id);
                          extras.onChange(others);
                        }}
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium",
                          primary.value === node.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {primary.value === node.id ? "Primary" : "Make primary"}
                      </button>
                    ) : null}
                  </div>
                  {node.children.length && !collapsed.has(node.id) ? (
                    <ul>{renderNodes(node.children, depth + 1)}</ul>
                  ) : null}
                </li>
              ));

            return (
              <Field data-invalid={fieldState.invalid}>
                <div className="max-h-72 overflow-y-auto">
                  {options.isLoading ? (
                    <p className="p-2 text-sm text-muted-foreground">Loading…</p>
                  ) : tree.length ? (
                    <ul>{renderNodes(tree, 0)}</ul>
                  ) : (
                    <p className="p-2 text-sm text-muted-foreground">
                      No categories yet.{" "}
                      <Link href="/admin/categories" className="underline">
                        Add one
                      </Link>
                      .
                    </p>
                  )}
                </div>
                <FieldDescription>
                  Tick every category the product belongs to. The primary one
                  sets its breadcrumb.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            );
          }}
        />
      )}
    />
  );
}

/* ---------------- Tags: chips with suggestions ---------------- */

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const suggestions = api.product.tagOptions.useQuery();

  function add(raw: string) {
    const tags = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!tags.length) return;
    onChange(Array.from(new Set([...value, ...tags])));
    setDraft("");
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={draft}
          list="tag-suggestions"
          placeholder="Add a tag, then press Enter"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add(draft);
            }
          }}
        />
        <Button type="button" variant="outline" onClick={() => add(draft)}>
          Add
        </Button>
        <datalist id="tag-suggestions">
          {(suggestions.data ?? [])
            .filter((t) => !value.includes(t))
            .map((t) => (
              <option key={t} value={t} />
            ))}
        </datalist>
      </div>
      {value.length ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="rounded-full p-0.5 hover:bg-background/60"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
      )}
    </div>
  );
}

/* ---------------- Linked products: search + chips ---------------- */

function ProductPicker({
  value,
  onChange,
  exclude,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  exclude?: string;
}) {
  const [search, setSearch] = useState("");
  const results = api.product.linkOptions.useQuery(
    { search, exclude },
    { enabled: search.trim().length > 0 },
  );
  const chosen = api.product.linkOptions.useQuery(
    { ids: value, exclude },
    { enabled: value.length > 0 },
  );

  return (
    <div className="space-y-3">
      {value.length ? (
        <ul className="flex flex-wrap gap-2">
          {(chosen.data ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-md border bg-muted/40 py-1 pl-1 pr-2 text-sm"
            >
              <span className="relative h-7 w-7 overflow-hidden rounded bg-muted">
                {p.image ? (
                  <Image src={p.image} alt="" fill sizes="28px" className="object-contain" />
                ) : null}
              </span>
              <span>{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.sku}</span>
              <button
                type="button"
                aria-label={`Remove ${p.name}`}
                onClick={() => onChange(value.filter((id) => id !== p.id))}
                className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or SKU…"
        />
        {search.trim() ? (
          <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
            {results.isLoading ? (
              <p className="p-2 text-sm text-muted-foreground">Searching…</p>
            ) : (results.data ?? []).filter((p) => !value.includes(p.id)).length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">No matches.</p>
            ) : (
              (results.data ?? [])
                .filter((p) => !value.includes(p.id))
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange([...value, p.id]);
                      setSearch("");
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <span className="flex-1">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.sku}</span>
                  </button>
                ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- Attributes: name + pipe-separated values ---------------- */

function AttributesEditor({ control }: { control: Control<FormValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name: "attributes" });

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Attributes describe the product — Finish: Gloss | Matte, Cure time:
          24 h. They show in a table on the product page.
        </p>
      ) : null}

      {fields.map((item, index) => (
        <div key={item.id} className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Controller
              name={`attributes.${index}.name`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="Finish"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name={`attributes.${index}.valuesText`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Values</FieldLabel>
                  <Input
                    id={field.name}
                    placeholder="Gloss | Matte | Satin"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <FieldDescription>Separate values with a “|”.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
          <div className="flex items-center justify-between">
            <Controller
              name={`attributes.${index}.visible`}
              control={control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id={field.name}
                    checked={field.value}
                    onCheckedChange={(on) => field.onChange(on === true)}
                  />
                  <FieldLabel htmlFor={field.name} className="font-normal">
                    Visible on the product page
                  </FieldLabel>
                </Field>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(index)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ name: "", valuesText: "", visible: true })}
      >
        <Plus className="h-4 w-4" />
        Add attribute
      </Button>
    </div>
  );
}

/* ---------------- Images for a product that does not exist yet ----------------
   Files go straight to R2 as soon as they are chosen — the same
   presigned-URL path the gallery uses — and the finished keys are
   recorded against the product once it is created. */

type PendingImage = { key: string; url: string; name: string };

function PendingImages({
  value,
  onChange,
}: {
  value: PendingImage[];
  onChange: (next: PendingImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const status = api.media.status.useQuery();
  const { uploadMany, uploading, busy } = useMediaUpload("products");

  const uploaded: PendingImage[] = value;

  const add = (rows: { key: string; url: string; filename: string }[]) => {
    const fresh = rows.filter((r) => !uploaded.some((u) => u.key === r.key));
    if (fresh.length) {
      onChange([...uploaded, ...fresh.map((r) => ({ key: r.key, url: r.url, name: r.filename }))]);
    }
  };

  async function upload(files: FileList | null) {
    add(await uploadMany(files));
  }

  if (status.data && !status.data.configured) {
    return (
      <p className="text-sm text-muted-foreground">
        Image storage is not connected. Add the five <code>R2_*</code> values to
        the environment and uploads will turn on here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          void upload(event.target.files);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void upload(event.dataTransfer.files);
        }}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-10 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted/40"
      >
        {busy ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Uploading {uploading} {uploading === 1 ? "file" : "files"}…
          </>
        ) : (
          <>
            <ImageUp className="h-5 w-5" />
            <span>
              <span className="font-medium text-foreground">Click to upload</span> or
              drag images here
            </span>
            <span className="text-xs">JPEG, PNG, WebP or AVIF · up to 8 MB each</span>
          </>
        )}
      </button>

      <Button type="button" variant="outline" className="w-full" onClick={() => setPicking(true)}>
        <Library className="h-4 w-4" />
        Choose from media library
      </Button>

      <MediaPicker
        open={picking}
        onOpenChange={setPicking}
        multiple
        folder="products"
        title="Add from the media library"
        onSelect={(rows) => add(rows)}
      />

      {uploaded.length ? (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {uploaded.map((image, index) => (
              <li key={image.key} className="group relative overflow-hidden rounded-lg border bg-muted">
                <div className="relative aspect-square">
                  <Image src={image.url} alt="" fill sizes="200px" className="object-cover" />
                </div>
                {index === 0 ? (
                  <Badge className="absolute left-2 top-2 gap-1">
                    <Star className="h-3 w-3" />
                    Main
                  </Badge>
                ) : null}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute right-2 top-2 size-7 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Remove ${image.name}`}
                  onClick={() => onChange(uploaded.filter((i) => i.key !== image.key))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            The first image becomes the main shot. Publish the product to save
            them; reorder and add alt text afterwards.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No images yet. The first one you add becomes the main shot on the shop.
        </p>
      )}
    </div>
  );
}
