"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

const inputClass =
  "mt-3 w-full border-b border-border bg-transparent pb-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

const detailsSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(10, "Use at least 10 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    path: ["confirm"],
    message: "The two passwords do not match",
  });

export function AccountDetailsForm() {
  const router = useRouter();
  const profile = api.account.profile.useQuery();

  return (
    <div className="max-w-lg space-y-14">
      {profile.data ? <DetailsForm initial={profile.data} onSaved={() => router.refresh()} /> : null}
      <PasswordForm />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function DetailsForm({
  initial,
  onSaved,
}: {
  initial: { name: string; email: string; phone: string | null };
  onSaved: () => void;
}) {
  const utils = api.useUtils();
  const form = useForm<z.infer<typeof detailsSchema>>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { name: initial.name, phone: initial.phone ?? "" },
  });

  const update = api.account.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Details saved");
      void utils.account.profile.invalidate();
      onSaved();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form onSubmit={form.handleSubmit((values) => update.mutate(values))} className="space-y-6">
      <h2 className="display text-lg">Your details</h2>

      <Text form={form} name="name" label="Full name" autoComplete="name" />

      <div>
        <span className="label text-muted-foreground">Email address</span>
        <p className="mt-3 break-all border-b border-border pb-3 text-foreground/75">
          {initial.email}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Ask us if you need this changed — orders are tied to it.
        </p>
      </div>

      <Text form={form} name="phone" label="Phone number" type="tel" autoComplete="tel" />

      <button
        type="submit"
        disabled={update.isPending}
        className="label flex items-center gap-3 bg-foreground px-8 py-4 text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
      >
        {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save details
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function PasswordForm() {
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
  });

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        const { error } = await authClient.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          revokeOtherSessions: true,
        });
        if (error) {
          form.setError("currentPassword", {
            message: "That password does not match the one on the account.",
          });
          return;
        }
        toast.success("Password changed");
        form.reset({ currentPassword: "", newPassword: "", confirm: "" });
      })}
      className="space-y-6"
    >
      <h2 className="display text-lg">Password</h2>

      <Text form={form} name="currentPassword" label="Current password" type="password" autoComplete="current-password" />
      <Text form={form} name="newPassword" label="New password" type="password" autoComplete="new-password" help="At least 10 characters." />
      <Text form={form} name="confirm" label="Confirm new password" type="password" autoComplete="new-password" />

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="label flex items-center gap-3 border-2 border-foreground px-8 py-4 transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
      >
        {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Change password
      </button>
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
  const id = `account-${name}`;
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
            className={cn(inputClass, error && "border-destructive")}
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
