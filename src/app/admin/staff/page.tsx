import { requirePermission } from "@/lib/admin-guard";
import { can } from "@/lib/permissions";
import { StaffManager } from "@/components/admin/staff-manager";

export const metadata = { title: "Staff" };

export default async function AdminStaffPage() {
  const me = await requirePermission("staff.view");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Who can sign in to this panel, and what each of them may do.
        </p>
      </div>
      <StaffManager currentUserId={me.id} canManage={can(me, "staff.manage")} />
    </div>
  );
}
