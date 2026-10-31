import path from "node:path";
import type { NextConfig } from "next";

// Where the Express API runs. The browser only ever talks to this Next.js app:
// /api/* is proxied to the API, so the auth cookie is first-party and no CORS setup is needed.
const API_URL = process.env.API_URL || "http://localhost:4000";

const nextConfig: NextConfig = {
  // Pin the project root to this folder, so a stray lockfile in a parent directory isn't picked as the root.
  turbopack: { root: path.join(__dirname) },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
