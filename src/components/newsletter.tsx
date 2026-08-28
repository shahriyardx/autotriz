"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Field, FieldError } from "@/components/ui-kit/field";
import { Heading } from "@/components/ui";

const formSchema = z.object({
  email: z.email("Enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

/** Newsletter sign-up. Posts to the shared enquiry endpoint with a
 *  `newsletter` topic, so there is only one intake to wire to a CRM. */
export function Newsletter() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    const response = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: "newsletter",
        email: values.email,
        message: "Newsletter sign-up",
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      form.setError("root", { message: payload.error ?? "Sign-up failed." });
    }
  }

  const done = form.formState.isSubmitSuccessful && !form.formState.errors.root;

  return (
    <section className="band bg-background py-20 md:py-24">
      <div className="shell">
        <Heading accent="with us" size="sm">
          Stay in touch
        </Heading>
        <p className="prose-center mt-5 max-w-xl text-sm text-foreground/75">
          Subscribe for product news, application guidance and updates from
          AUTOTRIZ.
        </p>

        {done ? (
          <p className="mt-10 text-center text-primary">
            You are on the list — thank you.
          </p>
        ) : (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row sm:items-start"
          >
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="flex-1 gap-2">
                  <label htmlFor={field.name} className="sr-only">
                    Email address
                  </label>
                  <input
                    id={field.name}
                    type="email"
                    placeholder="Email address"
                    aria-invalid={fieldState.invalid}
                    className="w-full rounded-sm border border-border px-5 py-4 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary aria-invalid:border-red-500"
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="label rounded-sm bg-primary px-8 py-4 text-primary-foreground transition-colors hover:bg-foreground hover:text-primary disabled:opacity-50"
            >
              {form.formState.isSubmitting ? "Sending…" : "Subscribe"}
            </button>
          </form>
        )}

        {form.formState.errors.root ? (
          <p className="mt-5 text-center text-sm text-red-600" role="alert">
            {form.formState.errors.root.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
