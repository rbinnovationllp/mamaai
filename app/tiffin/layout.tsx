import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tiffin ideas | टिफिन सुझाव",
  description: "Find practical tiffin suggestions with clear preparation, allergy and packing constraints.",
  robots: { index: false, follow: false }
};

export default function TiffinLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
