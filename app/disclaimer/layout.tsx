import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Food and health disclaimer | भोजन और स्वास्थ्य अस्वीकरण",
  description: "Understand the limits of MAMAAI meal-planning guidance and when to seek qualified professional advice."
};

export default function DisclaimerLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
