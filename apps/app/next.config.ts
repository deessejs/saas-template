import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/api", "@workspace/auth", "@workspace/database"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vercel.com",
        pathname: "/api/www/avatar",
      },
    ],
    // Vercel's avatar endpoint returns SVG. The remotePatterns allowlist
    // already restricts to vercel.com/api/www/avatar, so this is safe.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
