import { ClientPortalProvider } from "@/lib/clientPortalStore";
import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { ClientTopbar } from "@/components/layout/ClientTopbar";

// Original client admin shell. These pages are kept reachable at their
// existing URLs while they are migrated into the new /app area.
export default function LegacyLayout({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
