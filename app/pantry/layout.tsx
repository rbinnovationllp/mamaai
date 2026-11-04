import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My kitchen pantry | मेरी रसोई",
  description: "Manage household pantry items for safer, practical meal and grocery planning."
};

export default function PantryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
