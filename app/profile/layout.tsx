import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Family profile | पारिवारिक प्रोफ़ाइल",
  description: "Manage private household members, preferences and meal-planning context.",
  robots: { index: false, follow: false }
};

export default function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
