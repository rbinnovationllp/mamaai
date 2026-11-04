import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "More MAMAAI options | और विकल्प",
  description: "Open private MAMAAI account, support and household options.",
  robots: { index: false, follow: false }
};

export default function MoreLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
