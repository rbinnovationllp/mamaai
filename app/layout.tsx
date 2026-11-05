import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { RecognizedDeviceSession } from "@/components/account/RecognizedDeviceSession";
import type { Metadata, Viewport } from "next";
import { AnalyticsConsent } from "@/components/AnalyticsConsent";
import { LanguageProvider } from "@/components/LanguageProvider";
import { MobilePrimaryNav } from "@/components/MobilePrimaryNav";
import { AskMamaLauncher } from "@/components/ask-mama/AskMamaLauncher";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MAMAAI | Family meal planning",
    template: "%s | MAMAAI"
  },
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
      <body className="pb-20 md:pb-0">
        <LanguageProvider>
          <RecognizedDeviceSession />
          {children}
          <Footer />
          <AskMamaLauncher />
          <MobilePrimaryNav />
        </LanguageProvider>
        <AnalyticsConsent />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}



