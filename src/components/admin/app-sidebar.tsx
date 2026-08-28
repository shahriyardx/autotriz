"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Images,
  Inbox,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Ticket,
  Users,
} from "lucide-react";
import { can, type Permission } from "@/lib/permissions";
import { NavMain } from "@/components/admin/nav-main";
import { NavUser } from "@/components/admin/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui-kit/sidebar";

/** Sections of the admin panel. A section with `items` renders as a
 *  collapsible group; without, it is a plain link. */
const nav = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: ShoppingCart,
    permission: "orders.view" as Permission,
    items: [
      { title: "All orders", url: "/admin/orders" },
      { title: "Awaiting payment", url: "/admin/orders?status=pending" },
      { title: "Paid", url: "/admin/orders?status=paid" },
      { title: "Shipped", url: "/admin/orders?status=shipped" },
    ],
  },
  {
    title: "Catalogue",
    url: "/admin/products",
    icon: Package,
    permission: "products.view" as Permission,
    items: [
      { title: "Products", url: "/admin/products", permission: "products.view" as Permission },
      { title: "Add product", url: "/admin/products/new", permission: "products.edit" as Permission },
      { title: "Categories", url: "/admin/categories", permission: "categories.edit" as Permission },
    ],
  },
  { title: "Pages", url: "/admin/pages", icon: FileText, permission: "pages.edit" as Permission },
  { title: "Media", url: "/admin/media", icon: Images, permission: "media.view" as Permission },
  { title: "Discounts", url: "/admin/discounts", icon: Ticket, permission: "discounts.edit" as Permission },
  { title: "Enquiries", url: "/admin/enquiries", icon: Inbox, permission: "enquiries.view" as Permission },
  { title: "Staff", url: "/admin/staff", icon: Users, permission: "staff.view" as Permission },
  { title: "Settings", url: "/admin/settings", icon: Settings, permission: "settings.edit" as Permission },
];

/** Drops anything the signed-in account cannot open. The server still
 *  checks; this only stops us showing doors that will not open. */
type Actor = { role?: string | null; permissions?: unknown };

const allowed = (user: Actor, permission?: Permission) =>
  permission === undefined || can(user, permission);

function visibleNav(user: Actor) {
  return nav
    .filter((entry) => allowed(user, (entry as { permission?: Permission }).permission))
    .map((entry) =>
      "items" in entry && entry.items
        ? {
            ...entry,
            items: entry.items.filter((item) =>
              allowed(user, (item as { permission?: Permission }).permission),
            ),
          }
        : entry,
    );
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
    permissions?: unknown;
  };
}) {
  const items = visibleNav(user);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-card">
                  <Image
                    src="/brand/mark-yellow.png"
                    alt=""
                    width={64}
                    height={64}
                    className="size-5 object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">AUTOTRIZ</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Store admin
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
