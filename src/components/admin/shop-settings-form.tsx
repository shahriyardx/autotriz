"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { shopSettingsInput, type ShopSettings } from "@/lib/shop-settings";
import type { z } from "zod";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui-kit/field";
import { Input } from "@/components/ui-kit/input";
import { Textarea } from "@/components/ui-kit/textarea";

/* The details that appear in the header, the footer and on the contact
   page. Anything left empty falls back to the shipped value. */

/* What the fields hold while typing: every optional default is still
   optional until zod fills it in on submit. */
type Values = z.input<typeof shopSettingsInput>;

export function ShopSettingsForm({ initial }: { initial: ShopSettings }) {
  const router = useRouter();
  const utils = api.useUtils();
  const [resetting, setResetting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(shopSettingsInput),
    defaultValues: initial,
  });

  const save = api.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      form.reset(form.getValues());
      void utils.settings.get.invalidate();
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  const reset = api.settings.reset.useMutation({
    onSuccess: async () => {
      toast.success("Settings put back to the original values");
      setResetting(false);
      const fresh = await utils.settings.get.fetch();
      form.reset(fresh.settings);
      router.refresh();
    },
    onError: (error) => {
      setResetting(false);
      toast.error(error.message);
    },
  });

  const control = form.control;

  return (
    <form
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setResetting(true)}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button type="submit" disabled={save.isPending || !form.formState.isDirty}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <Text control={control} name="name" label="Shop name" />
              <Text
                control={control}
                name="registered"
                label="Registered name"
                help="Shown in the footer's copyright line."
              />
            </div>
            <Text
              control={control}
              name="tagline"
              label="Tagline"
              help="Sits in the yellow bar at the top of every page."
            />
            <Area
              control={control}
              name="description"
              label="Description"
              rows={3}
              help="The paragraph under the logo in the footer, and the site's search description."
            />
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <Text control={control} name="email" label="Email address" type="email" />
              <Text
                control={control}
                name="hours"
                label="Opening hours"
                help="Free text, e.g. Saturday to Thursday, 10:00 – 19:00."
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Text
                control={control}
                name="phone"
                label="Phone number"
                help="As you want it read: +880 1XXX-XXXXXX."
              />
              <Text
                control={control}
                name="tel"
                label="Phone number for links"
                help="The same number with no spaces: +8801XXXXXXXXX."
              />
            </div>

            <Text
              control={control}
              name="address"
              label="Street address"
              help="Left empty, only the city and country show."
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <Text control={control} name="city" label="City" />
              <Text control={control} name="country" label="Country" />
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social accounts</CardTitle>
          <p className="text-sm text-muted-foreground">
            Listed in the footer and on the contact page, in this order.
          </p>
        </CardHeader>
        <CardContent>
          <SocialLinks control={control} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending || !form.formState.isDirty}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
      </div>

      <AlertDialog open={resetting} onOpenChange={setResetting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset the shop settings?</AlertDialogTitle>
            <AlertDialogDescription>
              Every field goes back to the value the site shipped with. Your
              changes are discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => reset.mutate()}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function SocialLinks({ control }: { control: Control<Values> }) {
  const { fields, append, remove, move } = useFieldArray({ control, name: "social" });

  return (
    <div className="space-y-4">
      {fields.map((item, index) => (
        <div key={item.id} className="grid gap-4 rounded-lg border p-4 sm:grid-cols-[1fr_2fr_auto]">
          <Text control={control} name={`social.${index}.name`} label="Name" />
          <Text control={control} name={`social.${index}.href`} label="Address" />
          <div className="flex items-end gap-0.5 pb-1">
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
              className="size-9 text-destructive"
              aria-label={`Remove account ${index + 1}`}
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        disabled={fields.length >= 8}
        onClick={() => append({ name: "", href: "" })}
      >
        <Plus className="h-4 w-4" />
        Add an account
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/* Field paths are built from the schema at runtime, so they are plain
   strings here rather than a literal union. */
type Name = string;

function Text({
  control,
  name,
  label,
  type = "text",
  help,
}: {
  control: Control<Values>;
  name: Name;
  label: string;
  type?: string;
  help?: string;
}) {
  return (
    <Controller
      name={name as never}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            id={field.name}
            type={type}
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

function Area({
  control,
  name,
  label,
  rows = 3,
  help,
}: {
  control: Control<Values>;
  name: Name;
  label: string;
  rows?: number;
  help?: string;
}) {
  return (
    <Controller
      name={name as never}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Textarea
            id={field.name}
            rows={rows}
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
