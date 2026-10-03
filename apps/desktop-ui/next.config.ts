import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@paa/shared", "@paa/llm"],
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
