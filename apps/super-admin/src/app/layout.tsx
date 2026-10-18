import type { Metadata } from "next";
import "./globals.css";
import { PortalProvider } from "@/lib/store";
import { Shell } from "@/components/layout/Shell";

export const metadata: Metadata = {
  title: "Super Admin Portal | Face Recognition Attendance SaaS",
  description: "Enterprise multi-tenant control plane, forensic request tracing, UAT token accounting, and client fleet governance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <PortalProvider>
          <Shell>{children}</Shell>
        </PortalProvider>
      </body>
    </html>
  );
}
