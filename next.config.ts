import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Traces the files the server actually needs into `.next/standalone`,
     so the Docker image carries no `node_modules` of its own. */
  output: "standalone",
  images: {
    // Product images are served from the R2 bucket's public domain.
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(process.env.R2_PUBLIC_URL ?? "https://cdn.ccbot.app")
          .hostname,
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
