import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Temporarily skip trailing slash handling to avoid 404/500 page generation issues
  skipTrailingSlashRedirect: true,
};

export default nextConfig;

