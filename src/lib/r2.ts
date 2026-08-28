import "server-only";
import {
  CopyObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

/* ==================================================================
   Cloudflare R2

   Uploads never pass through this server. The browser asks for a
   presigned PUT, sends the file straight to R2, then tells us the key
   it used. That keeps large files off the serverless request path and
   means we never hold the account credentials in the client.

   Required environment:
     R2_ENDPOINT        https://<account-id>.r2.cloudflarestorage.com
     R2_ACCESS_KEY
     R2_SECRET_KEY
     R2_BUCKET
     R2_PUBLIC_URL      e.g. https://cdn.auto-triz.com
   ================================================================== */

export const R2_CONFIGURED = Boolean(
  process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY &&
    process.env.R2_SECRET_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_URL,
);

const BUCKET = process.env.R2_BUCKET ?? "";
const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

let client: S3Client | null = null;

function s3() {
  if (!R2_CONFIGURED) {
    throw new Error(
      "R2 is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET and R2_PUBLIC_URL.",
    );
  }

  client ??= new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY!,
      secretAccessKey: process.env.R2_SECRET_KEY!,
    },
  });

  return client;
}

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

/** Public URL for a stored object. */
export const publicUrl = (key: string) => `${PUBLIC_URL}/${key}`;

/** Turns a stored URL back into its key, so deletes work whether we were
 *  handed a key or a full URL. */
export function keyFromUrl(urlOrKey: string) {
  if (!urlOrKey.startsWith("http")) return urlOrKey.replace(/^\//, "");
  if (PUBLIC_URL && urlOrKey.startsWith(PUBLIC_URL)) {
    return urlOrKey.slice(PUBLIC_URL.length + 1);
  }
  try {
    return new URL(urlOrKey).pathname.replace(/^\//, "");
  } catch {
    return urlOrKey;
  }
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "file";

const extensionFor = (contentType: string) =>
  ({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  })[contentType] ?? "bin";

/** Builds a collision-proof key. The random suffix means re-uploading a
 *  file with the same name never silently replaces the old one. */
export function buildKey(options: {
  prefix: string;
  filename: string;
  contentType: string;
}) {
  const random = crypto.randomUUID().slice(0, 8);
  return `${options.prefix}/${slugify(options.filename)}-${random}.${extensionFor(options.contentType)}`;
}

export async function createUploadUrl(options: {
  key: string;
  contentType: string;
  contentLength: number;
}) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: options.key,
    ContentType: options.contentType,
    ContentLength: options.contentLength,
  });

  const url = await getSignedUrl(s3(), command, { expiresIn: 60 * 5 });
  return { url, key: options.key, publicUrl: publicUrl(options.key) };
}

/** Confirms the browser actually completed the upload before we record
 *  the key against a product. */
export async function objectExists(key: string) {
  try {
    await s3().send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** True when a stored URL points at R2 rather than at a file bundled in
 *  `public/`. The seeded catalogue images are local, and deleting one of
 *  those from R2 would be a no-op at best. */
export const isStoredInR2 = (url: string) =>
  Boolean(PUBLIC_URL) && url.startsWith(PUBLIC_URL);

export async function deleteObject(keyOrUrl: string) {
  const key = keyFromUrl(keyOrUrl);
  if (!key) return;
  await s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function deleteObjects(keysOrUrls: string[]) {
  const keys = keysOrUrls.map(keyFromUrl).filter(Boolean);
  if (!keys.length) return;

  await s3().send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    }),
  );
}

/** Renames an object by copying it to the new key and deleting the old
 *  one — S3 has no rename. Returns the new key and public URL. */
export async function renameObject(options: {
  key: string;
  filename: string;
  contentType: string;
}) {
  const prefix = options.key.includes("/") ? options.key.slice(0, options.key.lastIndexOf("/")) : "products";
  const nextKey = buildKey({ prefix, filename: options.filename, contentType: options.contentType });
  if (nextKey === options.key) return { key: options.key, url: publicUrl(options.key) };

  await s3().send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${options.key}`,
      Key: nextKey,
      ContentType: options.contentType,
      MetadataDirective: "REPLACE",
    }),
  );
  await s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: options.key }));

  return { key: nextKey, url: publicUrl(nextKey) };
}

/** Reads an object back out of the bucket. Used to serve a file from our
 *  own origin, which the canvas cropper needs — a CDN response cached
 *  without CORS headers cannot be drawn to a canvas. */
export async function getObject(key: string) {
  const result = await s3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return {
    body: result.Body as ReadableStream | undefined,
    contentType: result.ContentType ?? "application/octet-stream",
    contentLength: result.ContentLength,
  };
}
