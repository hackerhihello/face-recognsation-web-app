import type { Metadata } from "next";
import "./globals.css";
import { ClientPortalProvider } from "@/lib/clientPortalStore";
import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { ClientTopbar } from "@/components/layout/ClientTopbar";

export const metadata: Metadata = {
  title: "Client Admin Portal — Face Recognition Attendance SaaS",
  description: "Company-level Client Admin Dashboard for biometric attendance, workforce management, and geofencing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-50 dark:bg-[#040810] text-slate-900 dark:text-slate-100 flex font-sans antialiased">
        <ClientPortalProvider>
          <div className="flex w-full min-h-screen">
            <ClientSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <ClientTopbar />
              <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </ClientPortalProvider>
      </body>
    </html>
  );
}
