import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { requirePermission } from "@/lib/admin-guard";
import { trpc } from "@/trpc/server";
import { Badge } from "@/components/ui-kit/badge";

export const metadata = { title: "Pages" };

export default async function AdminPagesPage() {
  await requirePermission("pages.edit");
  const pages = await trpc.page.list();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The wording and pictures on the storefront pages. Layout stays as
          designed — only the content is editable.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {pages.map((page) => (
          <li key={page.key}>
            <div className="group flex h-full flex-col rounded-lg border bg-background p-6 transition-colors hover:border-foreground/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">
                    <Link href={`/admin/pages/${page.key}`} className="hover:underline">
                      {page.name}
                    </Link>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">{page.path}</p>
                </div>
                {page.edited ? <Badge variant="secondary">Edited</Badge> : null}
              </div>

              <p className="mt-3 flex-1 text-sm text-muted-foreground">{page.description}</p>

              <div className="mt-5 flex items-center justify-between">
                <Link
                  href={`/admin/pages/${page.key}`}
                  className="inline-flex items-center gap-1 text-sm font-medium hover:text-primary"
                >
                  Edit content
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href={page.path}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  View
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
