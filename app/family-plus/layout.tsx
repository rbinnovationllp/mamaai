import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Family+ | फैमिली प्लस",
  description: "Manage private Family+ household features and eligible pet profiles.",
  robots: { index: false, follow: false }
};

export default function FamilyPlusLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
