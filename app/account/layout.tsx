import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account and security | खाता और सुरक्षा",
  description: "Manage your MAMAAI account, household access and security settings.",
  robots: { index: false, follow: false }
};

export default function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
