import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        buffer: require.resolve("buffer"),
      },
    };
    return config;
  },
};

export default nextConfig;
