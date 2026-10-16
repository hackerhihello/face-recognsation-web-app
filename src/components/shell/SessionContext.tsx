"use client";

import { createContext, useContext } from "react";
import { hasPermission, type ClientRole, type Permission } from "@/lib/auth/roles";

/** Serializable subset of the server session that client components may read. */
export interface ClientSessionInfo {
  name: string;
  email: string;
  role: ClientRole;
  companyName: string;
  isPreview: boolean;
}

const SessionContext = createContext<ClientSessionInfo | null>(null);

export function SessionProvider({ value, children }: { value: ClientSessionInfo; children: React.ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

/** UI-only permission check. The backend must authorize the operation too. */
export function useCan(permission: Permission) {
  return hasPermission(useSession().role, permission);
}
