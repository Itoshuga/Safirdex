import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb",
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default withNextIntl(nextConfig);
