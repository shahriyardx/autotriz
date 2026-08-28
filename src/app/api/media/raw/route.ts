import { NextResponse, type NextRequest } from "next/server";
import { currentUser } from "@/lib/admin-guard";
import { R2_CONFIGURED, getObject } from "@/lib/r2";

/**
 * Serves a bucket object from our own origin.
 *
 * The media cropper draws the image to a canvas, which the browser only
 * allows for same-origin images or ones fetched with working CORS headers.
 * A CDN copy cached without those headers cannot be used, so the admin
 * reads the file through here instead.
 */
export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorised", { status: 401 });
  if (!R2_CONFIGURED) return new NextResponse("Storage is not configured", { status: 503 });

  const key = request.nextUrl.searchParams.get("key");
  if (!key) return new NextResponse("Missing key", { status: 400 });

  try {
    const object = await getObject(key);
    if (!object.body) return new NextResponse("Not found", { status: 404 });

    return new NextResponse(object.body, {
      headers: {
        "Content-Type": object.contentType,
        ...(object.contentLength ? { "Content-Length": String(object.contentLength) } : {}),
        // Private to this admin session, so never cached by a proxy.
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
