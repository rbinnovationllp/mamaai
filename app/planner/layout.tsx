import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekly meal planner | साप्ताहिक भोजन योजना",
  description: "Create and review a household-aware weekly meal plan with attendance, dietary and practical cooking needs."
};

export default function PlannerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
