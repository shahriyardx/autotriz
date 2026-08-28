"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

/* Customer sign-in and registration. Staff use the separate screen at
   /admin/login; this one only ever creates customer accounts. */

const inputClass =
  "mt-3 w-full border-b border-border bg-transparent pb-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary aria-invalid:border-destructive";

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(10, "Use at least 10 characters"),
});

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        const { error } = await authClient.signIn.email(values);
        if (error) {
          form.setError("root", { message: "Those details do not match an account." });
          return;
        }
        router.push(next);
        router.refresh();
      })}
      className="space-y-6"
    >
      <h1 className="display text-2xl">Sign in</h1>

      <Text form={form} name="email" label="Email address" type="email" autoComplete="email" />
      <Text form={form} name="password" label="Password" type="password" autoComplete="current-password" />

      {form.formState.errors.root ? (
        <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="label flex w-full items-center justify-center gap-3 bg-foreground px-6 py-4 text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
      >
        {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Sign in
      </button>

      <p className="text-sm text-foreground/75">
        New here?{" "}
        <Link
          href={`/account/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="underline decoration-primary underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        const { error } = await authClient.signUp.email(values);
        if (error) {
          form.setError("root", {
            message: error.message ?? "Could not create the account. Try another email address.",
          });
          return;
        }
        router.push(next);
        router.refresh();
      })}
      className="space-y-6"
    >
      <h1 className="display text-2xl">Create an account</h1>
      <p className="text-sm text-foreground/75">
        Track your orders and check out without typing your address again.
      </p>

      <Text form={form} name="name" label="Full name" autoComplete="name" />
      <Text form={form} name="email" label="Email address" type="email" autoComplete="email" />
      <Text
        form={form}
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        help="At least 10 characters."
      />

      {form.formState.errors.root ? (
        <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="label flex w-full items-center justify-center gap-3 bg-foreground px-6 py-4 text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
      >
        {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Create account
      </button>

      <p className="text-sm text-foreground/75">
        Already have one?{" "}
        <Link
          href={`/account/login${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="underline decoration-primary underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function Text<T extends Record<string, unknown>>({
  form,
  name,
  label,
  type = "text",
  help,
  autoComplete,
}: {
  form: ReturnType<typeof useForm<T>>;
  name: string;
  label: string;
  type?: string;
  help?: string;
  autoComplete?: string;
}) {
  const id = `auth-${name}`;
  const error = (form.formState.errors as Record<string, { message?: string }>)[name];

  return (
    <Controller
      name={name as never}
      control={form.control}
      render={({ field }) => (
        <div>
          <label htmlFor={id} className="label text-muted-foreground">
            {label}
          </label>
          <input
            id={id}
            type={type}
            autoComplete={autoComplete}
            aria-invalid={Boolean(error)}
            className={cn(inputClass)}
            {...field}
            value={(field.value as string) ?? ""}
          />
          {error?.message ? (
            <p className="mt-2 text-xs text-destructive">{error.message}</p>
          ) : help ? (
            <p className="mt-2 text-xs text-muted-foreground">{help}</p>
          ) : null}
        </div>
      )}
    />
  );
}
