import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Local QA uses 127.0.0.1 while Next may bind development resources to
  // localhost. Permit the loopback origin so client hydration (including the
  // signed-in session check) is not blocked in the isolated QA environment.
  allowedDevOrigins: ["127.0.0.1"],
  // Keep a local `next dev` watcher out of the production-build directory.
  // Vercel and `next build` continue to use the default `.next` directory.
  distDir: process.env.NEXT_BUILD_DIR ?? (process.env.NODE_ENV === "development" && !process.env.VERCEL ? ".next-dev" : ".next"),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.vercel-insights.com; manifest-src 'self' https://vercel.com; frame-src https://api.razorpay.com https://checkout.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self' https://api.razorpay.com https://checkout.razorpay.com; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
  turbopack: {
    root: projectRoot
  },
  webpack: (config) => {
    config.resolve.alias["@"] = projectRoot;
    return config;
  }
};

export default nextConfig;

