"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type { CategoryInput } from "@/server/api/schemas";
import { Badge } from "@/components/ui-kit/badge";
import { Button } from "@/components/ui-kit/button";
import { Checkbox } from "@/components/ui-kit/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui-kit/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-kit/dropdown-menu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui-kit/table";
import { Textarea } from "@/components/ui-kit/textarea";
import { MediaPicker } from "@/components/admin/media/media-library";
import { IMAGE_ACCEPT, useMediaUpload } from "@/components/admin/media/use-upload";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------
   Types
   ------------------------------------------------------------------ */

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  href: string;
  blurb: string | null;
  image: string | null;
  displayType: "default" | "products" | "subcategories" | "both";
  showInMenu: boolean;
  sortOrder: number;
  active: boolean;
  productCount: number;
};

type Node = CategoryRow & { children: Node[]; depth: number };

const DISPLAY_TYPES: { value: CategoryRow["displayType"]; label: string; hint: string }[] = [
  { value: "default", label: "Default", hint: "Follow the shop-wide setting." },
  { value: "products", label: "Products", hint: "List the products straight away." },
  { value: "subcategories", label: "Sub-categories", hint: "Show the sub-category tiles only." },
  { value: "both", label: "Both", hint: "Sub-category tiles, then the products." },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Flat rows → nested tree, sorted by sortOrder within each level. */
function buildTree(rows: CategoryRow[]): Node[] {
  const byParent = new Map<string | null, CategoryRow[]>();
  for (const row of rows) {
    const list = byParent.get(row.parentId) ?? [];
    list.push(row);
    byParent.set(row.parentId, list);
  }
  const walk = (parentId: string | null, depth: number): Node[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((row) => ({ ...row, depth, children: walk(row.id, depth + 1) }));
  return walk(null, 0);
}

function flatten(nodes: Node[], collapsed: Set<string>): Node[] {
  const out: Node[] = [];
  const visit = (list: Node[]) => {
    for (const node of list) {
      out.push(node);
      if (!collapsed.has(node.id)) visit(node.children);
    }
  };
  visit(nodes);
  return out;
}

/** Ids under `id`, so the parent picker can hide them. */
function descendants(nodes: Node[], id: string): Set<string> {
  const out = new Set<string>();
  const find = (list: Node[]): Node | undefined => {
    for (const n of list) {
      if (n.id === id) return n;
      const hit = find(n.children);
      if (hit) return hit;
    }
  };
  const start = find(nodes);
  const collect = (n: Node | undefined) => {
    if (!n) return;
    for (const c of n.children) {
      out.add(c.id);
      collect(c);
    }
  };
  collect(start);
  return out;
}

/* ------------------------------------------------------------------
   Form
   ------------------------------------------------------------------ */

const formSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lower-case words separated by hyphens"),
  parentId: z.string(),
  href: z.string().trim().startsWith("/", "Must start with /"),
  blurb: z.string(),
  image: z.string(),
  displayType: z.enum(["default", "products", "subcategories", "both"]),
  showInMenu: z.boolean(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const NO_PARENT = "__none__";

export function CategoryManager({ initial }: { initial: CategoryRow[] }) {
  const router = useRouter();
  const utils = api.useUtils();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [presetParent, setPresetParent] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");

  const list = api.category.list.useQuery(undefined, { initialData: initial });
  const tree = useMemo(() => buildTree(list.data), [list.data]);
  const visible = useMemo(() => {
    const rows = flatten(tree, collapsed);
    const term = filter.trim().toLowerCase();
    if (!term) return rows;
    return flatten(tree, new Set()).filter(
      (r) => r.name.toLowerCase().includes(term) || r.slug.includes(term),
    );
  }, [tree, collapsed, filter]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      parentId: NO_PARENT,
      href: "/shop",
      blurb: "",
      image: "",
      displayType: "default",
      showInMenu: false,
      active: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: editing?.name ?? "",
      slug: editing?.slug ?? "",
      parentId: editing?.parentId ?? presetParent ?? NO_PARENT,
      href: editing?.href ?? "/shop",
      blurb: editing?.blurb ?? "",
      image: editing?.image ?? "",
      displayType: editing?.displayType ?? "default",
      showInMenu: editing?.showInMenu ?? false,
      active: editing?.active ?? true,
    });
  }, [editing, presetParent, open, form]);

  // New categories take their slug and page path from the name until
  // either is edited by hand.
  const name = form.watch("name");
  useEffect(() => {
    if (editing || !open) return;
    const slug = slugify(name ?? "");
    if (!form.getFieldState("slug").isDirty) form.setValue("slug", slug);
    if (!form.getFieldState("href").isDirty) {
      form.setValue("href", slug ? `/shop?category=${slug}` : "/shop");
    }
  }, [name, editing, open, form]);

  const done = (message: string) => {
    toast.success(message);
    setOpen(false);
    utils.category.list.invalidate();
    router.refresh();
  };
  const fail = (error: { message: string }) => toast.error(error.message);

  const create = api.category.create.useMutation({
    onSuccess: () => done("Category created"),
    onError: fail,
  });
  const update = api.category.update.useMutation({
    onSuccess: () => done("Category updated"),
    onError: fail,
  });
  const remove = api.category.delete.useMutation({
    onSuccess: () => {
      setDeleting(null);
      done("Category deleted");
    },
    onError: (error) => {
      setDeleting(null);
      fail(error);
    },
  });
  const reorder = api.category.reorder.useMutation({
    onSuccess: () => utils.category.list.invalidate(),
    onError: fail,
  });
  const setActive = api.category.setActive.useMutation({
    onSuccess: () => {
      setSelected(new Set());
      utils.category.list.invalidate();
      router.refresh();
    },
    onError: fail,
  });

  const saving = create.isPending || update.isPending;

  function openNew(parentId: string | null = null) {
    setEditing(null);
    setPresetParent(parentId);
    setOpen(true);
  }

  function openEdit(row: CategoryRow) {
    setEditing(row);
    setPresetParent(null);
    setOpen(true);
  }

  function onSubmit(values: FormValues) {
    const payload: CategoryInput = {
      name: values.name,
      slug: values.slug,
      parentId: values.parentId === NO_PARENT ? null : values.parentId,
      href: values.href,
      blurb: values.blurb.trim() === "" ? null : values.blurb,
      image: values.image.trim() === "" ? null : values.image,
      displayType: values.displayType,
      showInMenu: values.showInMenu,
      sortOrder: editing?.sortOrder ?? list.data.length,
      active: values.active,
    };
    if (editing) update.mutate({ ...payload, id: editing.id });
    else create.mutate(payload);
  }

  /** Swap with the neighbour above/below inside the same parent. */
  function nudge(row: Node, direction: -1 | 1) {
    const siblings = (
      row.parentId
        ? flatten(tree, new Set()).find((n) => n.id === row.parentId)?.children
        : tree
    ) ?? [];
    const ids = siblings.map((s) => s.id);
    const from = ids.indexOf(row.id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    reorder.mutate({ parentId: row.parentId, ids });
  }

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelected(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const excludedParents = editing ? descendants(tree, editing.id) : new Set<string>();
  const parentOptions = flatten(tree, new Set()).filter(
    (n) => n.id !== editing?.id && !excludedParents.has(n.id),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => openNew()}>
            <Plus className="h-4 w-4" />
            Add category
          </Button>
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search categories…"
            aria-label="Search categories"
            className="w-56"
          />
        </div>

        {selected.size ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{selected.size} selected</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActive.mutate({ ids: Array.from(selected), active: true })}
            >
              <Eye className="h-4 w-4" />
              Show
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActive.mutate({ ids: Array.from(selected), active: false })}
            >
              <EyeOff className="h-4 w-4" />
              Hide
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="w-14" />
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Slug</TableHead>
              <TableHead className="hidden lg:table-cell">Display</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={row.id} className={cn(!row.active && "opacity-60")}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={(on) => toggleSelected(row.id, on === true)}
                    aria-label={`Select ${row.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="relative h-10 w-10 overflow-hidden rounded bg-muted">
                    {row.image ? (
                      <Image
                        src={row.image}
                        alt=""
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className="flex items-center gap-1"
                    style={{ paddingLeft: filter ? 0 : row.depth * 20 }}
                  >
                    {row.children.length && !filter ? (
                      <button
                        type="button"
                        onClick={() => toggleCollapsed(row.id)}
                        aria-label={collapsed.has(row.id) ? "Expand" : "Collapse"}
                        className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted"
                      >
                        {collapsed.has(row.id) ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    ) : row.depth > 0 && !filter ? (
                      <CornerDownRight className="h-4 w-4 text-muted-foreground/60" />
                    ) : (
                      <span className="size-5" />
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="font-medium hover:underline"
                    >
                      {row.name}
                    </button>
                    {row.children.length ? (
                      <span className="text-xs text-muted-foreground">
                        ({row.children.length})
                      </span>
                    ) : null}
                  </div>
                  {row.blurb ? (
                    <p
                      className="mt-0.5 line-clamp-1 text-xs text-muted-foreground"
                      style={{ paddingLeft: filter ? 0 : row.depth * 20 + 24 }}
                    >
                      {row.blurb}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                  {row.slug}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {DISPLAY_TYPES.find((d) => d.value === row.displayType)?.label}
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.productCount}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={row.active ? "secondary" : "outline"}>
                      {row.active ? "Visible" : "Hidden"}
                    </Badge>
                    {row.showInMenu ? <Badge>In menu</Badge> : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Move up"
                      disabled={Boolean(filter) || reorder.isPending}
                      onClick={() => nudge(row, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Move down"
                      disabled={Boolean(filter) || reorder.isPending}
                      onClick={() => nudge(row, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for ${row.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(row)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openNew(row.id)}>
                          <CornerDownRight className="h-4 w-4" />
                          Add sub-category
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setActive.mutate({ ids: [row.id], active: !row.active })
                          }
                        >
                          {row.active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          {row.active ? "Hide" : "Show"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {filter ? "No categories match." : "No categories yet."}
          </p>
        ) : null}
      </div>

      {/* ---------------------------------------------------------- */}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
            <DialogDescription>
              Categories group products in the shop. Nest them to build a
              range, like Coatings › Glass.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input id={field.name} aria-invalid={fieldState.invalid} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="slug"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                    <Input id={field.name} aria-invalid={fieldState.invalid} {...field} />
                    <FieldDescription>The URL-friendly version of the name.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="parentId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Parent category</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PARENT}>None (top level)</SelectItem>
                        {parentOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {"  ".repeat(option.depth)}
                            {option.depth > 0 ? "› " : ""}
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>Leave empty for a top-level category.</FieldDescription>
                  </Field>
                )}
              />
            </div>

            <Controller
              name="blurb"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea id={field.name} rows={3} {...field} />
                  <FieldDescription>
                    Shown on the range cards and at the top of the category page.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                name="displayType"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Display type</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISPLAY_TYPES.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      {DISPLAY_TYPES.find((d) => d.value === field.value)?.hint}
                    </FieldDescription>
                  </Field>
                )}
              />
              <Controller
                name="href"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Page path</FieldLabel>
                    <Input id={field.name} aria-invalid={fieldState.invalid} {...field} />
                    <FieldDescription>Where the category links to on the site.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="image"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Thumbnail</FieldLabel>
                  <CategoryImagePicker value={field.value} onChange={field.onChange} />
                </Field>
              )}
            />

            <Controller
              name="showInMenu"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal" className="rounded-lg border p-4">
                  <div className="flex-1 space-y-0.5">
                    <FieldLabel htmlFor={field.name}>Show in the shop menu</FieldLabel>
                    <FieldDescription>
                      Appears in the header and footer menus. With none ticked,
                      the first four top-level categories are used.
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

            <Controller
              name="active"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal" className="rounded-lg border p-4">
                  <div className="flex-1 space-y-0.5">
                    <FieldLabel htmlFor={field.name}>Visible in the shop</FieldLabel>
                    <FieldDescription>
                      Hidden categories keep their products but disappear from menus and filters.
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? "Save changes" : "Add category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(next) => !next && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Sub-categories move up one level. Products that use this as
              their primary category will block the delete — move them first.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && remove.mutate({ id: deleting.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------
   Thumbnail upload — straight to R2, same path the product gallery uses.
   ------------------------------------------------------------------ */

function CategoryImagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const status = api.media.status.useQuery();
  const { uploadOne, busy: uploading } = useMediaUpload("categories");

  async function upload(file: File | undefined) {
    if (!file) return;
    const row = await uploadOne(file);
    if (row) onChange(row.url);
  }

  const disabled = status.data ? !status.data.configured : false;

  return (
    <div className="flex items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
        {value ? (
          <Image src={value} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <ImagePlus className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {value ? "Replace" : "Upload"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
            Library
          </Button>
          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              Remove
            </Button>
          ) : null}
        </div>

        <MediaPicker
          open={picking}
          onOpenChange={setPicking}
          folder="categories"
          title="Choose a thumbnail"
          onSelect={(rows) => rows[0] && onChange(rows[0].url)}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="…or paste an image URL"
          className="h-8 w-64 text-xs"
        />
        {disabled ? (
          <p className="text-xs text-muted-foreground">
            Uploads turn on once the R2 keys are set. A URL still works.
          </p>
        ) : null}
      </div>
    </div>
  );
}
