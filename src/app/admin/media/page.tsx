import { requirePermission } from "@/lib/admin-guard";
import { MediaLibrary } from "@/components/admin/media/media-library";

export const metadata = { title: "Media" };

export default async function AdminMediaPage() {
  await requirePermission("media.view");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every file uploaded to the shop. Rename, crop, copy a link, or see
          where a file is used before deleting it.
        </p>
      </div>
      <MediaLibrary />
    </div>
  );
}
