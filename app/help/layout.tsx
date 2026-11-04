import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help and support | सहायता केंद्र",
  description: "Find MAMAAI account, meal-planning, privacy and support information."
};

export default function HelpLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
