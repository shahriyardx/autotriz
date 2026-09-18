import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Traces the files the server actually needs into `.next/standalone`,
     so the Docker image carries no `node_modules` of its own. */
  output: "standalone",
  images: {
    /* The bucket's public domain, plus anything named in
       IMAGE_HOSTS (comma-separated) — a CDN the shop has moved away
       from still has rows in the media library pointing at it, and an
       unlisted host is a hard error rather than a broken thumbnail. */
    remotePatterns: [
      ...(process.env.R2_PUBLIC_URL
        ? [{ protocol: "https" as const, hostname: new URL(process.env.R2_PUBLIC_URL).hostname }]
        : []),
      ...(process.env.IMAGE_HOSTS ?? "")
        .split(",")
        .map((host) => host.trim())
        .filter(Boolean)
        .map((hostname) => ({ protocol: "https" as const, hostname })),
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
