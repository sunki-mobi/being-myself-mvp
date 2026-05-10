import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 blocks cross-origin requests to /_next/webpack-hmr by default.
  // The booth iPad and the dev laptop hit the dev server via LAN IP, so we
  // whitelist those origins. Without this, HMR fails and the client falls
  // into a WebSocket reconnect loop that re-mounts React every ~200ms.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.0.51",
    "192.168.*",
    "10.*",
  ],
};

export default nextConfig;
