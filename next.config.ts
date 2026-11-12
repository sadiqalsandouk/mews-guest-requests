import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let phones open the dev server: same Wi-Fi (private IPs) or the https demo tunnel.
  // Hide the Next.js dev badge: it covers the guest page on phones during demos.
  devIndicators: false,
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.trycloudflare.com"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
