import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd()
  },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(process.cwd());
    return config;
  }
};

export default nextConfig;
