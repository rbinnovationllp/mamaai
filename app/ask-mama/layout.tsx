import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask MAMA | भोजन सहायता",
  description: "Ask MAMA for practical family meal-planning guidance, with clear food-safety boundaries and your household preferences in mind."
};

export default function AskMamaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
