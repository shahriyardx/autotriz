"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { GripVertical, ImageUp, Library, Loader2, Star, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui-kit/button";
import { Badge } from "@/components/ui-kit/badge";
import { MediaPicker } from "@/components/admin/media/media-library";
import { IMAGE_ACCEPT, useMediaUpload } from "@/components/admin/media/use-upload";
import { cn } from "@/lib/cn";

type ImageRow = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

/** Product gallery: upload straight to R2, reorder by dragging, delete.
 *  The first image in the list is the one the shop uses as the main shot. */
export function ImageManager({ productId }: { productId: string }) {
  const utils = api.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const { uploadMany, uploading, busy } = useMediaUpload("products");

  const status = api.media.status.useQuery();
  const images = api.media.listForProduct.useQuery({ productId });

  const attach = api.media.attachToProduct.useMutation({
    onSuccess: () => utils.media.listForProduct.invalidate({ productId }),
  });
  const remove = api.media.remove.useMutation({
    onSuccess: () => {
      toast.success("Image removed");
      utils.media.listForProduct.invalidate({ productId });
    },
    onError: (error) => toast.error(error.message),
  });
  const reorder = api.media.reorder.useMutation({
    onSuccess: () => utils.media.listForProduct.invalidate({ productId }),
    onError: (error) => toast.error(error.message),
  });

  const upload = useCallback(
    async (files: FileList | null) => {
      const rows = await uploadMany(files);
      for (const row of rows) {
        await attach.mutateAsync({ productId, key: row.key, alt: row.alt });
      }
      if (rows.length) toast.success(`${rows.length} ${rows.length === 1 ? "image" : "images"} added`);
    },
    [attach, productId, uploadMany],
  );

  function onDrop(targetId: string) {
    const rows = images.data ?? [];
    if (!dragId || dragId === targetId) return;

    const ids = rows.map((row) => row.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    ids.splice(to, 0, ids.splice(from, 1)[0]);
    reorder.mutate({ productId, ids });
    setDragId(null);
    setOverId(null);
  }

  if (status.data && !status.data.configured) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium text-amber-900">Image storage is not connected</p>
          <p className="mt-1 text-amber-800">
            Add the five <code>R2_*</code> values to the environment and uploads
            will turn on here. Existing images keep working in the meantime.
          </p>
        </div>
      </div>
    );
  }

  const rows: ImageRow[] = images.data ?? [];

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          void upload(event.target.files);
          event.target.value = "";
        }}
      />

      <MediaPicker
        open={picking}
        onOpenChange={setPicking}
        multiple
        folder="products"
        title="Add from the media library"
        onSelect={async (rows) => {
          for (const row of rows) {
            await attach.mutateAsync({ productId, key: row.key, alt: row.alt });
          }
          if (rows.length) toast.success(`${rows.length} ${rows.length === 1 ? "image" : "images"} added`);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void upload(event.dataTransfer.files);
        }}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-10 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted/40"
      >
        {busy ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Uploading {uploading} {uploading === 1 ? "file" : "files"}…
          </>
        ) : (
          <>
            <ImageUp className="h-5 w-5" />
            <span>
              <span className="font-medium text-foreground">Click to upload</span> or
              drag images here
            </span>
            <span className="text-xs">JPEG, PNG, WebP or AVIF · up to 8 MB each</span>
          </>
        )}
      </button>

      <Button type="button" variant="outline" className="w-full" onClick={() => setPicking(true)}>
        <Library className="h-4 w-4" />
        Choose from media library
      </Button>

      {rows.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rows.map((row, index) => (
            <li
              key={row.id}
              draggable
              onDragStart={() => setDragId(row.id)}
              onDragEnter={() => setOverId(row.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDrop(row.id)}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={cn(
                "group relative overflow-hidden rounded-lg border bg-muted",
                dragId === row.id && "opacity-40",
                overId === row.id && dragId !== row.id && "ring-2 ring-primary",
              )}
            >
              <div className="relative aspect-square">
                <Image
                  src={row.url}
                  alt={row.alt ?? ""}
                  fill
                  sizes="200px"
                  className="object-contain p-2"
                />
              </div>

              {index === 0 ? (
                <Badge className="absolute left-2 top-2 gap-1">
                  <Star className="h-3 w-3" />
                  Main
                </Badge>
              ) : null}

              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="grid size-7 cursor-grab place-items-center rounded-md bg-background/90 text-muted-foreground shadow-sm">
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="size-7"
                  aria-label="Delete image"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate({ id: row.id })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No images yet. The first one you add becomes the main shot on the shop.
        </p>
      )}
    </div>
  );
}
