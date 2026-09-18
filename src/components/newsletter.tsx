"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Check } from "lucide-react";
import { Field, FieldError } from "@/components/ui-kit/field";

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
    /* A dark band, set against the pale one above it. Centred black
       type on white read as a gap in the page rather than as the last
       thing the page asks of anyone. */
    <section className="dark relative isolate overflow-hidden bg-card py-16 text-foreground md:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_20%_50%,rgba(242,196,0,0.10),transparent_70%)]"
      />

      <div className="shell relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="label text-primary">Newsletter</p>
          <h2 className="display mt-4 text-[clamp(1.5rem,3vw,2.25rem)] text-foreground">
            Stay in touch <span className="accent">with us</span>
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-foreground/65">
            Product news, application guidance and the occasional word from the
            Dhaka studio. No more than once a month.
          </p>
        </div>

        <div>
          {done ? (
            <div className="flex items-center gap-4 border border-primary/40 bg-primary/10 p-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-5" />
              </span>
              <p className="display-tight text-base text-foreground">
                You are on the list — thank you.
              </p>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              {/* One control: the field and the button share a border, so
                  they cannot sit at different heights. */}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <label htmlFor={field.name} className="sr-only">
                      Email address
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-0">
                      <input
                        id={field.name}
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        aria-invalid={fieldState.invalid}
                        className="w-full border border-foreground/20 bg-background/40 px-5 py-4 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary aria-invalid:border-red-500 sm:border-r-0"
                        {...field}
                      />
                      <button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                        className="label group inline-flex shrink-0 items-center justify-center gap-2.5 bg-primary px-8 py-4 text-primary-foreground transition-colors hover:bg-foreground hover:text-primary disabled:opacity-50"
                      >
                        {form.formState.isSubmitting ? "Sending…" : "Subscribe"}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>

                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {form.formState.errors.root ? (
                <p className="mt-3 text-sm text-red-400" role="alert">
                  {form.formState.errors.root.message}
                </p>
              ) : null}

              <p className="mt-3 text-xs text-foreground/45">
                We only use your address for this. Unsubscribe whenever you like.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
