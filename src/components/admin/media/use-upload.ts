"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/trpc/react";

/* One upload path for the whole admin: presign → PUT straight to R2 →
   record the object in the media library. Everything that accepts a
   file goes through this, so nothing lands in the bucket unindexed. */

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type UploadedMedia = {
  id: string;
  key: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  title: string | null;
};

/** Reads the pixel dimensions without decoding the whole file to a canvas. */
export function readImageSize(file: Blob): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export function useMediaUpload(folder = "products") {
  const utils = api.useUtils();
  const [uploading, setUploading] = useState(0);
  const createUploadUrl = api.media.createUploadUrl.useMutation();
  const record = api.media.record.useMutation();

  /** Uploads one file and returns its library entry, or null on failure. */
  const uploadOne = useCallback(
    async (file: File): Promise<UploadedMedia | null> => {
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(`${file.name} is larger than 8 MB`);
        return null;
      }
      setUploading((n) => n + 1);
      try {
        const size = await readImageSize(file);
        const target = await createUploadUrl.mutateAsync({
          filename: file.name,
          contentType: file.type as "image/jpeg",
          size: file.size,
          prefix: folder,
        });

        const response = await fetch(target.url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!response.ok) throw new Error(`Upload failed (${response.status})`);

        const row = await record.mutateAsync({
          key: target.key,
          filename: file.name,
          mimeType: file.type as "image/jpeg",
          size: file.size,
          width: size?.width ?? null,
          height: size?.height ?? null,
          folder,
        });

        return row as UploadedMedia;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Could not upload ${file.name}`);
        return null;
      } finally {
        setUploading((n) => n - 1);
      }
    },
    [createUploadUrl, record, folder],
  );

  /** Uploads a list of files in order and returns the ones that landed. */
  const uploadMany = useCallback(
    async (files: FileList | File[] | null): Promise<UploadedMedia[]> => {
      if (!files) return [];
      const out: UploadedMedia[] = [];
      for (const file of Array.from(files)) {
        const row = await uploadOne(file);
        if (row) out.push(row);
      }
      if (out.length) void utils.media.library.invalidate();
      return out;
    },
    [uploadOne, utils],
  );

  return { uploadOne, uploadMany, uploading, busy: uploading > 0 };
}
