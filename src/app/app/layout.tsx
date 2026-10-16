import { requireClientSession } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/AppShell";

export default async function ClientAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireClientSession();
  return (
    <AppShell
      session={{
        name: session.name,
        email: session.email,
        role: session.role,
        companyName: session.companyName ?? session.clientId,
        isPreview: session.isPreview,
      }}
    >
      {children}
    </AppShell>
  );
}
