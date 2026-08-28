import { AppSidebar } from "@/components/admin/app-sidebar";
import { TRPCProvider } from "@/trpc/react";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Separator } from "@/components/ui-kit/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui-kit/sidebar";
import { Toaster } from "@/components/ui-kit/sonner";
import { currentUser } from "@/lib/admin-guard";

export const metadata = { robots: { index: false, follow: false } };

/** The shell wraps every /admin route except the ones a signed-out
 *  visitor is allowed to see, which bring their own full-screen layout. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  // The two signed-out screens bring their own full-page layout, but they
  // still belong to the dark admin surface.
  if (!user) return children;

  return (
    <TRPCProvider>
      <SidebarProvider>
        <AppSidebar
          user={{
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            permissions: user.permissions,
          }}
        />

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <AdminBreadcrumbs />
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>

        <Toaster position="top-right" />
      </SidebarProvider>
    </TRPCProvider>
  );
}
