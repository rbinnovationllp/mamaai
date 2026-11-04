import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping list | खरीदारी सूची",
  description: "Review your private household shopping list and purchased-item progress.",
  robots: { index: false, follow: false }
};

export default function ShoppingListLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
