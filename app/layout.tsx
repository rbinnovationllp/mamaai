import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAMA AI",
  description: "One Family. Different Needs. One Intelligent Meal Plan.",
  manifest: "/manifest.webmanifest",
  applicationName: "MAMAAI",
  appleWebApp: {
    capable: true,
    title: "MAMAAI",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/icons/mamaai-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/mamaai-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/mamaai-icon-192.png", sizes: "192x192", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#24745a"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
