import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb",
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
