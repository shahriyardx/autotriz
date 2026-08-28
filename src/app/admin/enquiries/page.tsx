import { desc } from "drizzle-orm";
import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { requirePermission } from "@/lib/admin-guard";
import { EnquiryRow } from "@/components/admin/enquiry-row";

export const metadata = { title: "Enquiries" };

export default async function AdminEnquiriesPage() {
  await requirePermission("enquiries.view");

  const rows = await db
    .select()
    .from(enquiries)
    .orderBy(desc(enquiries.createdAt))
    .limit(200);

  const open = rows.filter((row) => !row.handled).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Enquiries</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} received · {open} still open
        </p>
      </div>

      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <EnquiryRow key={row.id} enquiry={{ ...row, createdAt: row.createdAt.toISOString() }} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border bg-background py-16 text-center text-sm text-muted-foreground">
          Nothing yet. Contact form and newsletter sign-ups land here.
        </p>
      )}
    </div>
  );
}
