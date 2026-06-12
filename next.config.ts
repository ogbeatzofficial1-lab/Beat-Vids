import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage CDN
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        // Supabase signed URLs
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/sign/**",
      },
    ],
  },

  // Silence known harmless warnings from Supabase SSR
  experimental: {
    serverComponentsExternalPackages: ["@supabase/ssr"],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY"              },
          { key: "X-Content-Type-Options",     value: "nosniff"           },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // Redirect bare domain to dashboard if authed (handled by middleware)
  async redirects() {
    return [
      {
        source:      "/home",
        destination: "/dashboard",
        permanent:   true,
      },
    ];
  },
};

export default nextConfig;
