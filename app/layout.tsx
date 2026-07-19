import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAMA AI",
  description: "One Family. Different Needs. One Intelligent Meal Plan."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
