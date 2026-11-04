import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy | गोपनीयता नीति",
  description: "Read how MAMAAI handles customer information, preferences and privacy choices."
};

export default function PrivacyLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
