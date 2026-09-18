"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Field, FieldError } from "@/components/ui-kit/field";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

const formSchema = z.object({
  firstName: z.string().trim().min(1, "Required"),
  lastName: z.string().trim().min(1, "Required"),
  email: z.email("Enter a valid email address"),
  phone: z.string().trim(),
  company: z.string().trim(),
  country: z.string().trim().min(1, "Required"),
  message: z.string().trim().min(1, "Please tell us a little more"),
});

type FormValues = z.infer<typeof formSchema>;

const fields = [
  { name: "firstName", label: "First name", type: "text", half: true },
  { name: "lastName", label: "Last name", type: "text", half: true },
  { name: "email", label: "Email", type: "email", half: true },
  { name: "phone", label: "Phone", type: "tel", half: true },
  { name: "company", label: "Company", type: "text", half: true },
  { name: "country", label: "Country", type: "text", half: true },
] as const;

/* Boxed rather than a single underline. An underline field on a pale
   band reads as a gap in the page until it is clicked; a box says
   where to type before anyone touches it. */
const inputClass =
  "mt-2.5 w-full rounded-sm border border-border bg-background px-4 py-3.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-foreground/30 focus:border-primary focus:ring-2 focus:ring-primary/15 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/15";

export function LeadForm({
  topic,
  submitLabel = "Send enquiry",
  messageLabel = "Tell us about your business",
}: {
  topic: string;
  submitLabel?: string;
  messageLabel?: string;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      country: "",
      message: "",
    },
  });

  async function onSubmit(values: FormValues) {
    const response = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, topic }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      form.setError("root", {
        message: payload.error ?? "Something went wrong. Please try again.",
      });
    }
  }

  if (form.formState.isSubmitSuccessful && !form.formState.errors.root) {
    return (
      <div className="border-t-2 border-primary bg-background p-10">
        <p className="label text-muted-foreground">Received</p>
        <p className="display mt-5 text-3xl">Thank you.</p>
        <p className="mt-4 max-w-md text-foreground/75">
          Your enquiry is with our Dhaka desk. Expect
          a reply within one working day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 sm:grid-cols-2">
      {fields.map((entry) => (
        <Controller
          key={entry.name}
          name={entry.name}
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
              className={cn("gap-0", !entry.half && "sm:col-span-2")}
            >
              <label htmlFor={field.name} className="label text-muted-foreground">
                {entry.label}
              </label>
              <input
                id={field.name}
                type={entry.type}
                aria-invalid={fieldState.invalid}
                className={inputClass}
                {...field}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      ))}

      <Controller
        name="message"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-0 sm:col-span-2">
            <label htmlFor={field.name} className="label text-muted-foreground">
              {messageLabel}
            </label>
            <textarea
              id={field.name}
              rows={4}
              aria-invalid={fieldState.invalid}
              className={cn(inputClass, "resize-none")}
              {...field}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {form.formState.errors.root ? (
        <p className="label text-red-600 sm:col-span-2" role="alert">
          {form.formState.errors.root.message}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" variant="solid" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending…" : submitLabel}
        </Button>
        <p className="mt-5 max-w-md text-xs text-muted-foreground">
          We use these details only to answer your enquiry. Nothing is passed to
          third parties.
        </p>
      </div>
    </form>
  );
}
