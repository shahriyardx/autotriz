"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, type Control, type UseFormReturn } from "react-hook-form";
import {
  ExternalLink,
  Film,
  GripVertical,
  ImagePlus,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import type { Field as FieldDef, PageDef } from "@/lib/page-content";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { MediaPicker } from "@/components/admin/media/media-library";
import { Button } from "@/components/ui-kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-kit/card";
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui-kit/field";
import { Input } from "@/components/ui-kit/input";
import { Textarea } from "@/components/ui-kit/textarea";

/* ==================================================================
   A form built from a page definition. The layout of the site is not
   editable — only the words, pictures and small repeating lists that
   each page declares.
   ================================================================== */

type Values = Record<string, unknown>;

export function PageEditor({ def, initial }: { def: PageDef; initial: Values }) {
  const router = useRouter();
  const utils = api.useUtils();
  const [resetting, setResetting] = useState(false);

  const form = useForm<Values>({ defaultValues: initial });

  const save = api.page.update.useMutation({
    onSuccess: () => {
      toast.success("Page updated");
      form.reset(form.getValues());
      void utils.page.get.invalidate({ page: def.key });
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const reset = api.page.reset.useMutation({
    onSuccess: async () => {
      toast.success("Page put back to the original copy");
      setResetting(false);
      const fresh = await utils.page.get.fetch({ page: def.key });
      form.reset(fresh.content as Values);
      router.refresh();
    },
    onError: (error) => {
      setResetting(false);
      toast.error(error.message);
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => save.mutate({ page: def.key, content: values }))}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{def.description}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href={def.path} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              View page
            </Link>
          </Button>
          <Button type="button" variant="ghost" onClick={() => setResetting(true)}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button type="submit" disabled={save.isPending || !form.formState.isDirty}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      </div>

      {def.sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            {section.description ? (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-5">
            {section.fields.map((field) => (
              <FieldControl key={field.key} field={field} form={form} name={field.key} />
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={save.isPending || !form.formState.isDirty}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
      </div>

      <AlertDialog open={resetting} onOpenChange={setResetting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset {def.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Every field goes back to the copy the site shipped with. Your
              edits to this page are discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => reset.mutate({ page: def.key })}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function FieldControl({
  field,
  form,
  name,
}: {
  field: FieldDef;
  form: UseFormReturn<Values>;
  name: string;
}) {
  if (field.type === "list") {
    return <ListControl field={field} form={form} name={name} />;
  }

  const id = `field-${name.replace(/\./g, "-")}`;

  if (field.type === "markdown") {
    const value = (form.watch(name) as string) ?? "";
    return (
      <Field>
        <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
        <MarkdownEditor
          id={id}
          value={value}
          onChange={(next) => form.setValue(name, next, { shouldDirty: true })}
          minHeight="10rem"
          placeholder={field.placeholder}
        />
        {field.help ? <FieldDescription>{field.help}</FieldDescription> : null}
      </Field>
    );
  }

  if (field.type === "image") {
    return <ImageControl field={field} form={form} name={name} id={id} />;
  }

  if (field.type === "video") {
    return <VideoControl field={field} form={form} name={name} id={id} />;
  }

  if (field.type === "textarea") {
    return (
      <Field>
        <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
        <Textarea id={id} rows={3} placeholder={field.placeholder} {...form.register(name)} />
        {field.help ? <FieldDescription>{field.help}</FieldDescription> : null}
      </Field>
    );
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
      <Input
        id={id}
        placeholder={field.placeholder ?? (field.type === "link" ? "/shop" : undefined)}
        {...form.register(name)}
      />
      {field.help ? <FieldDescription>{field.help}</FieldDescription> : null}
    </Field>
  );
}

/* ------------------------------------------------------------------ */

function ImageControl({
  field,
  form,
  name,
  id,
}: {
  field: FieldDef;
  form: UseFormReturn<Values>;
  name: string;
  id: string;
}) {
  const [picking, setPicking] = useState(false);
  const value = (form.watch(name) as string) ?? "";

  return (
    <Field>
      <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md border bg-muted">
          {value ? (
            <Image src={value} alt="" fill sizes="128px" className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
              {value ? "Replace" : "Choose image"}
            </Button>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => form.setValue(name, "", { shouldDirty: true })}
              >
                Remove
              </Button>
            ) : null}
          </div>
          <Input
            id={id}
            value={value}
            onChange={(event) => form.setValue(name, event.target.value, { shouldDirty: true })}
            placeholder="…or paste a URL"
            className="h-8 text-xs"
          />
        </div>
      </div>
      {field.help ? <FieldDescription>{field.help}</FieldDescription> : null}

      <MediaPicker
        open={picking}
        onOpenChange={setPicking}
        folder="content"
        title={field.label}
        onSelect={(rows) => rows[0] && form.setValue(name, rows[0].url, { shouldDirty: true })}
      />
    </Field>
  );
}

/* ------------------------------------------------------------------ */

function VideoControl({
  field,
  form,
  name,
  id,
}: {
  field: FieldDef;
  form: UseFormReturn<Values>;
  name: string;
  id: string;
}) {
  const value = (form.watch(name) as string) ?? "";

  return (
    <Field>
      <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md border bg-muted">
          {value ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={value} muted playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">
              <Film className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            id={id}
            value={value}
            onChange={(event) => form.setValue(name, event.target.value, { shouldDirty: true })}
            placeholder="/video/hero.mp4"
          />
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => form.setValue(name, "", { shouldDirty: true })}
            >
              Remove video
            </Button>
          ) : null}
        </div>
      </div>
      {field.help ? <FieldDescription>{field.help}</FieldDescription> : null}
    </Field>
  );
}

/* ------------------------------------------------------------------ */

function ListControl({
  field,
  form,
  name,
}: {
  field: Extract<FieldDef, { type: "list" }>;
  form: UseFormReturn<Values>;
  name: string;
}) {
  // The field paths are built from the page definition at runtime, so
  // they cannot be typed literally.
  const { fields, append, remove, move } = useFieldArray({
    control: form.control as unknown as Control<Record<string, unknown[]>>,
    name: name as never,
  });

  const blank = Object.fromEntries(field.fields.map((f) => [f.key, ""]));
  const full = field.max !== undefined && fields.length >= field.max;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{field.label}</p>
        <span className="text-xs text-muted-foreground">
          {fields.length}
          {field.max ? ` of ${field.max}` : ""}
        </span>
      </div>
      {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}

      {fields.map((item, index) => (
        <div key={item.id} className="rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <GripVertical className="h-3.5 w-3.5" />
              {field.itemLabel} {index + 1}
            </p>
            <div className="flex gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                Up
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
              >
                Down
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-destructive"
                aria-label={`Remove ${field.itemLabel} ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {field.fields.map((sub) => (
              <FieldControl
                key={sub.key}
                field={sub}
                form={form}
                name={`${name}.${index}.${sub.key}`}
              />
            ))}
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" disabled={full} onClick={() => append(blank)}>
        <Plus className="h-4 w-4" />
        Add {field.itemLabel}
      </Button>
    </div>
  );
}
