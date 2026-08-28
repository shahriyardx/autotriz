"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Check,
  Copy,
  Loader2,
  Mail,
  MoreHorizontal,
  Pause,
  Play,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import {
  PERMISSION_GROUPS,
  ROLES,
  ROLE_PRESETS,
  expandPermissions,
  type Permission,
  type Role,
} from "@/lib/permissions";
import { Badge } from "@/components/ui-kit/badge";
import { Button } from "@/components/ui-kit/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui-kit/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui-kit/dropdown-menu";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui-kit/field";
import { Input } from "@/components/ui-kit/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui-kit/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui-kit/table";
import { cn } from "@/lib/cn";

/* ==================================================================
   Staff: who can sign in, what they may do, and who has been invited
   but has not accepted yet.
   ================================================================== */

type Member = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  permissions: string[];
  banned: boolean | null;
  createdAt: Date | string;
};

type Invite = {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  invitedByName: string | null;
  expiresAt: Date | string;
};

const roleLabel = (role: string | null) =>
  ROLES.find((r) => r.key === role)?.label ?? role ?? "—";

export function StaffManager({ currentUserId, canManage }: { currentUserId: string; canManage: boolean }) {
  const router = useRouter();
  const utils = api.useUtils();
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [lastLink, setLastLink] = useState<{ email: string; url: string } | null>(null);

  const list = api.staff.list.useQuery();
  const members = (list.data?.members ?? []) as Member[];
  const invites = (list.data?.invites ?? []) as Invite[];
  const mailConfigured = list.data?.mailConfigured ?? false;

  const refresh = () => {
    void utils.staff.list.invalidate();
    router.refresh();
  };
  const fail = (error: { message: string }) => toast.error(error.message);

  const resend = api.staff.resendInvite.useMutation({
    onSuccess: ({ url, sent, email }) => {
      if (sent) toast.success(`Invitation re-sent to ${email}`);
      else setLastLink({ email, url });
      refresh();
    },
    onError: fail,
  });
  const revoke = api.staff.revokeInvite.useMutation({
    onSuccess: () => {
      toast.success("Invitation withdrawn");
      refresh();
    },
    onError: fail,
  });
  const setSuspended = api.staff.setSuspended.useMutation({
    onSuccess: () => {
      toast.success("Saved");
      refresh();
    },
    onError: fail,
  });
  const remove = api.staff.remove.useMutation({
    onSuccess: () => {
      toast.success("Account removed");
      setRemoving(null);
      refresh();
    },
    onError: (error) => {
      setRemoving(null);
      fail(error);
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {members.length} {members.length === 1 ? "account" : "accounts"}
          {invites.length ? ` · ${invites.length} pending` : ""}
        </p>
        {canManage ? (
          <Button onClick={() => setInviting(true)}>
            <UserPlus className="h-4 w-4" />
            Invite staff
          </Button>
        ) : null}
      </div>

      {!mailConfigured && canManage ? (
        <p className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Email is not connected, so invitations are not sent automatically.
          You will be given a link to pass on. Set the <code>SMTP_*</code>{" "}
          values to send them by email.
        </p>
      ) : null}

      {/* ---------------- pending invitations ---------------- */}
      {invites.length ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Pending invitations</h2>
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Invited by</TableHead>
                  <TableHead className="hidden md:table-cell">Expires</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabel(invite.role)}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {invite.invitedByName ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={resend.isPending}
                            onClick={() => resend.mutate({ id: invite.id })}
                          >
                            <Send className="h-3.5 w-3.5" />
                            Resend
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            aria-label={`Withdraw the invitation for ${invite.email}`}
                            onClick={() => revoke.mutate({ id: invite.id })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}

      {/* ---------------- accounts ---------------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Accounts</h2>
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden lg:table-cell">Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isSelf = member.id === currentUserId;
                const owner = member.role === "owner";
                return (
                  <TableRow key={member.id} className={cn(member.banned && "opacity-60")}>
                    <TableCell className="font-medium">
                      {member.name}
                      {isSelf ? (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={owner ? "default" : "secondary"}>{roleLabel(member.role)}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {owner ? "Everything" : `${member.permissions.length} permissions`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.banned ? "outline" : "secondary"}>
                        {member.banned ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canManage && !(owner && !isSelf) ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`Actions for ${member.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing(member)}>
                              <ShieldCheck className="h-4 w-4" />
                              Edit access
                            </DropdownMenuItem>
                            {!isSelf ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setSuspended.mutate({
                                      id: member.id,
                                      suspended: !member.banned,
                                    })
                                  }
                                >
                                  {member.banned ? (
                                    <Play className="h-4 w-4" />
                                  ) : (
                                    <Pause className="h-4 w-4" />
                                  )}
                                  {member.banned ? "Restore access" : "Suspend"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setRemoving(member)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <InviteDialog
        open={inviting}
        onOpenChange={setInviting}
        onSent={(result) => {
          if (result.sent) toast.success(`Invitation sent to ${result.email}`);
          else setLastLink({ email: result.email, url: result.url });
          refresh();
        }}
      />

      {editing ? (
        <AccessDialog
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      ) : null}

      <InviteLinkDialog link={lastLink} onClose={() => setLastLink(null)} />

      <AlertDialog open={removing !== null} onOpenChange={(next) => !next && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They lose access immediately. Orders and changes they made stay
              as they are. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => removing && remove.mutate({ id: removing.id })}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const inviteSchema = z.object({
  email: z.email("Enter a valid email address"),
  role: z.enum(["admin", "manager", "staff"]),
});

function InviteDialog({
  open,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: (result: { email: string; url: string; sent: boolean }) => void;
}) {
  const [granted, setGranted] = useState<Permission[]>(ROLE_PRESETS.staff);
  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "staff" },
  });

  // Reopening starts from a clean slate.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      form.reset({ email: "", role: "staff" });
      setGranted(ROLE_PRESETS.staff);
    }
  }

  const invite = api.staff.invite.useMutation({
    onSuccess: (result) => {
      onOpenChange(false);
      onSent(result);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite a staff member</DialogTitle>
          <DialogDescription>
            They receive a link, set their own password, and arrive with
            exactly the access you tick here.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) =>
            invite.mutate({ ...values, permissions: granted }),
          )}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email address</FieldLabel>
                  <Input
                    id={field.name}
                    type="email"
                    placeholder="name@example.com"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="role"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setGranted(ROLE_PRESETS[value as Role]);
                    }}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.filter((r) => r.key !== "owner").map((role) => (
                        <SelectItem key={role.key} value={role.key}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {ROLES.find((r) => r.key === field.value)?.description}
                  </FieldDescription>
                </Field>
              )}
            />
          </div>

          <PermissionPicker granted={granted} onChange={setGranted} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

function AccessDialog({
  member,
  onClose,
  onSaved,
}: {
  member: Member;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<Role>((member.role as Role) ?? "staff");
  const [granted, setGranted] = useState<Permission[]>(
    expandPermissions(member.permissions),
  );

  const update = api.staff.updateAccess.useMutation({
    onSuccess: () => {
      toast.success("Access updated");
      onSaved();
    },
    onError: (error) => toast.error(error.message),
  });

  const owner = member.role === "owner";

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Access for {member.name}</DialogTitle>
          <DialogDescription>{member.email}</DialogDescription>
        </DialogHeader>

        {owner ? (
          <p className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            This is the owner account. It always has full access and cannot be
            limited.
          </p>
        ) : (
          <div className="space-y-5">
            <Field>
              <FieldLabel htmlFor="access-role">Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(value) => {
                  setRole(value as Role);
                  setGranted(ROLE_PRESETS[value as Role]);
                }}
              >
                <SelectTrigger id="access-role" className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.filter((r) => r.key !== "owner").map((r) => (
                    <SelectItem key={r.key} value={r.key}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {ROLES.find((r) => r.key === role)?.description}
              </FieldDescription>
            </Field>

            <PermissionPicker granted={granted} onChange={setGranted} />
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!owner ? (
            <Button
              type="button"
              disabled={update.isPending}
              onClick={() => update.mutate({ id: member.id, role, permissions: granted })}
            >
              {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save access
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

function PermissionPicker({
  granted,
  onChange,
}: {
  granted: Permission[];
  onChange: (next: Permission[]) => void;
}) {
  const has = (key: Permission) => granted.includes(key);

  const toggle = (key: Permission) => {
    if (has(key)) {
      // Dropping a permission also drops anything that depends on it.
      const next = granted.filter((p) => p !== key);
      onChange(expandPermissions(next).filter((p) => p !== key && next.includes(p)));
      return;
    }
    onChange(expandPermissions([...granted, key]));
  };

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium">Permissions</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {PERMISSION_GROUPS.map(({ group, items }) => (
          <div key={group} className="rounded-md border p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group}
            </p>
            <ul className="mt-3 space-y-2.5">
              {items.map((item) => (
                <li key={item.key}>
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={has(item.key)}
                      onChange={() => toggle(item.key)}
                      className="mt-0.5 h-4 w-4 accent-primary"
                    />
                    <span>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Ticking something also grants what it needs — editing products
        includes viewing them.
      </p>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */

function InviteLinkDialog({
  link,
  onClose,
}: {
  link: { email: string; url: string } | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Dialog open={link !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send this link to {link?.email}</DialogTitle>
          <DialogDescription>
            Email is not connected yet, so the invitation was not sent for you.
            The link works once, and stops working in seven days.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input readOnly value={link?.url ?? ""} className="font-mono text-xs" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Copy the invitation link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link?.url ?? "");
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                toast.error("Could not copy — select the link and copy it by hand.");
              }
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
