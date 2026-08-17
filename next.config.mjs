import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.vercel-insights.com; frame-src https://api.razorpay.com https://checkout.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self' https://api.razorpay.com https://checkout.razorpay.com; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
  turbopack: {
    root: process.cwd()
  },
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(process.cwd());
    return config;
  }
};

export default nextConfig;
