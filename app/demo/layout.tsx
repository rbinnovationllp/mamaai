import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Family meal-plan demo | पारिवारिक भोजन डेमो",
  description: "Try MAMAAI's private, browser-only vegetarian family meal-plan demo. Demo edits are temporary and never saved to a customer household."
};

export default function DemoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
