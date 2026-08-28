/* ==================================================================
   Staff permissions.

   Free of any database or server import so the admin UI can use the
   same catalogue the server enforces.
   ================================================================== */

export const PERMISSIONS = [
  { key: "products.view", group: "Catalogue", label: "View products" },
  { key: "products.edit", group: "Catalogue", label: "Create and edit products", implies: ["products.view"] },
  { key: "products.delete", group: "Catalogue", label: "Delete products", implies: ["products.view"] },
  { key: "categories.edit", group: "Catalogue", label: "Manage categories", implies: ["products.view"] },
  { key: "media.view", group: "Media", label: "View the media library" },
  { key: "media.edit", group: "Media", label: "Upload, rename and crop files", implies: ["media.view"] },
  { key: "media.delete", group: "Media", label: "Delete files", implies: ["media.view"] },
  { key: "orders.view", group: "Orders", label: "View orders" },
  { key: "orders.edit", group: "Orders", label: "Change order status", implies: ["orders.view"] },
  { key: "orders.refund", group: "Orders", label: "Refund and cancel orders", implies: ["orders.view"] },
  { key: "discounts.edit", group: "Marketing", label: "Manage discount codes" },
  { key: "enquiries.view", group: "Marketing", label: "Read enquiries" },
  { key: "enquiries.edit", group: "Marketing", label: "Handle enquiries", implies: ["enquiries.view"] },
  { key: "staff.view", group: "Administration", label: "See the staff list" },
  { key: "staff.manage", group: "Administration", label: "Invite staff and set permissions", implies: ["staff.view"] },
  { key: "pages.edit", group: "Content", label: "Edit page content" },
  { key: "settings.edit", group: "Administration", label: "Change shop settings" },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];

export const ALL_PERMISSIONS = PERMISSIONS.map((p) => p.key) as Permission[];

export const PERMISSION_GROUPS = Array.from(
  new Set(PERMISSIONS.map((p) => p.group)),
).map((group) => ({
  group,
  items: PERMISSIONS.filter((p) => p.group === group),
}));

/* ------------------------------------------------------------------
   Roles. `owner` always holds everything, whatever is stored against
   the account — otherwise a shop could be locked out of itself.
   ------------------------------------------------------------------ */

export const ROLES = [
  {
    key: "owner",
    label: "Owner",
    description: "Full access, including staff and settings. Cannot be limited.",
  },
  {
    key: "admin",
    label: "Administrator",
    description: "Everything except managing other staff, unless granted.",
  },
  {
    key: "manager",
    label: "Manager",
    description: "Runs the catalogue and orders day to day.",
  },
  {
    key: "staff",
    label: "Staff",
    description: "Limited to what you tick below.",
  },
] as const;

export type Role = (typeof ROLES)[number]["key"];

/** The permissions a role starts with when you pick it in the invite form. */
export const ROLE_PRESETS: Record<Role, Permission[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS.filter((p) => p !== "staff.manage"),
  manager: [
    "products.view",
    "products.edit",
    "categories.edit",
    "media.view",
    "media.edit",
    "orders.view",
    "orders.edit",
    "discounts.edit",
    "enquiries.view",
    "enquiries.edit",
    "pages.edit",
  ],
  staff: ["products.view", "orders.view", "enquiries.view", "media.view"],
};

/** Ticking a permission also grants what it depends on. */
export function expandPermissions(granted: readonly string[]): Permission[] {
  const out = new Set<string>();
  const add = (key: string) => {
    if (out.has(key)) return;
    out.add(key);
    const entry = PERMISSIONS.find((p) => p.key === key);
    for (const implied of (entry as { implies?: readonly string[] })?.implies ?? []) add(implied);
  };
  for (const key of granted) if (ALL_PERMISSIONS.includes(key as Permission)) add(key);
  return ALL_PERMISSIONS.filter((p) => out.has(p));
}

/** The single answer to "may this account do that?". */
export function can(
  user: { role?: string | null; permissions?: unknown } | null | undefined,
  permission: Permission,
): boolean {
  if (!user) return false;
  if (user.role === "owner") return true;
  const granted = Array.isArray(user.permissions) ? (user.permissions as string[]) : [];
  return granted.includes(permission);
}

export const isOwner = (user: { role?: string | null } | null | undefined) =>
  user?.role === "owner";
