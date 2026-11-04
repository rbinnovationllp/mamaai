import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service | सेवा की शर्तें",
  description: "Review the current MAMAAI service terms and important customer information."
};

export default function TermsLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
