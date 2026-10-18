"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  ClientTenant,
  MasterAdmin,
  Employee,
  ApiTokenRecord,
  RequestTraceRecord,
  AuditLogEntry,
  ErrorLogEntry,
  ApiEndpointConfig,
  SystemServiceHealth,
  Environment,
} from "@/types/portal";
import {
  INITIAL_CLIENTS,
  INITIAL_MASTER_ADMINS,
  INITIAL_EMPLOYEES,
  INITIAL_API_TOKENS,
  INITIAL_REQUEST_TRACES,
  INITIAL_AUDIT_LOGS,
  INITIAL_ERROR_LOGS,
  INITIAL_API_ENDPOINTS,
  INITIAL_SYSTEM_HEALTH,
} from "@/data/mockDatabase";

interface PortalContextType {
  // Theme
  isDark: boolean;
  toggleTheme: () => void;

  // Selected global environment filter
  selectedEnv: Environment | "ALL";
  setSelectedEnv: (env: Environment | "ALL") => void;

  // Clients
  clients: ClientTenant[];
  addClient: (client: Omit<ClientTenant, "createdAt" | "updatedAt" | "totalEmployees" | "totalMasterAdmins">) => void;
  updateClientStatus: (clientId: string, status: ClientTenant["status"]) => void;

  // Master Admins
  masterAdmins: MasterAdmin[];
  addMasterAdmin: (admin: Omit<MasterAdmin, "createdAt">) => void;
  updateMasterAdminStatus: (masterId: string, status: MasterAdmin["status"]) => void;

  // Employees
  employees: Employee[];

  // API Tokens
  tokens: ApiTokenRecord[];
  provisionToken: (token: Omit<ApiTokenRecord, "createdAt" | "consumedQuota" | "remainingQuota" | "status" | "tokenHash">) => { tokenId: string; rawSecret: string };
  rotateToken: (tokenId: string) => { newMasked: string; rawSecret: string } | null;
  revokeToken: (tokenId: string) => void;

  // Request Traces
  requestTraces: Record<string, RequestTraceRecord>;
  searchRequest: (requestId: string) => RequestTraceRecord | null;

  // Audit Logs
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, "auditId" | "timestamp">) => void;

  // Error Logs
  errorLogs: ErrorLogEntry[];

  // API Endpoints
  apiEndpoints: ApiEndpointConfig[];
  toggleEndpointStatus: (id: string) => void;

  // Feature Flags
  updateClientFeatureFlag: (clientId: string, flagName: keyof ClientTenant["enabledFeatures"], value: boolean) => void;

  // System Health
  systemHealth: SystemServiceHealth[];

  // Toast / Alerts
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [selectedEnv, setSelectedEnv] = useState<Environment | "ALL">("ALL");
  const [clients, setClients] = useState<ClientTenant[]>(INITIAL_CLIENTS);
  const [masterAdmins, setMasterAdmins] = useState<MasterAdmin[]>(INITIAL_MASTER_ADMINS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [tokens, setTokens] = useState<ApiTokenRecord[]>(INITIAL_API_TOKENS);
  const [requestTraces, setRequestTraces] = useState<Record<string, RequestTraceRecord>>(INITIAL_REQUEST_TRACES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>(INITIAL_ERROR_LOGS);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpointConfig[]>(INITIAL_API_ENDPOINTS);
  const [systemHealth, setSystemHealth] = useState<SystemServiceHealth[]>(INITIAL_SYSTEM_HEALTH);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync theme with html tag
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const addAuditLog = (entry: Omit<AuditLogEntry, "auditId" | "timestamp">) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      auditId: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Add client
  const addClient = (newClientData: Omit<ClientTenant, "createdAt" | "updatedAt" | "totalEmployees" | "totalMasterAdmins">) => {
    const client: ClientTenant = {
      ...newClientData,
      totalEmployees: 0,
      totalMasterAdmins: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setClients((prev) => [client, ...prev]);
    addAuditLog({
      requestId: `REQ-${Date.now()}`,
      actorEmail: "superadmin@faceattend.io",
      actorRole: "SUPER_ADMIN",
      targetResource: `clients/${client.clientId}`,
      action: "CREATE_CLIENT",
      clientId: client.clientId,
      companyName: client.companyName,
      environment: client.allowedEnvironments[0] || "UAT",
      outcome: "SUCCESS",
      metadata: { plan: client.subscriptionPlan },
    });
    showToast(`Client ${client.companyName} (${client.clientId}) provisioned successfully.`);
  };

  // Update client status
  const updateClientStatus = (clientId: string, status: ClientTenant["status"]) => {
    setClients((prev) =>
      prev.map((c) => (c.clientId === clientId ? { ...c, status, updatedAt: new Date().toISOString() } : c))
    );
    const target = clients.find((c) => c.clientId === clientId);
    addAuditLog({
      requestId: `REQ-${Date.now()}`,
      actorEmail: "superadmin@faceattend.io",
      actorRole: "SUPER_ADMIN",
      targetResource: `clients/${clientId}`,
      action: `UPDATE_STATUS_${status}`,
      clientId,
      companyName: target?.companyName,
      environment: "PROD",
      outcome: "SUCCESS",
    });
    showToast(`Client ${clientId} status updated to ${status}.`);
  };

  // Add master admin
  const addMasterAdmin = (adminData: Omit<MasterAdmin, "createdAt">) => {
    const admin: MasterAdmin = {
      ...adminData,
      createdAt: new Date().toISOString(),
    };
    setMasterAdmins((prev) => [admin, ...prev]);
    // increment client count
    setClients((prev) =>
      prev.map((c) => (c.clientId === admin.clientId ? { ...c, totalMasterAdmins: c.totalMasterAdmins + 1 } : c))
    );
    addAuditLog({
      requestId: `REQ-${Date.now()}`,
      actorEmail: "superadmin@faceattend.io",
      actorRole: "SUPER_ADMIN",
      targetResource: `masterAdmins/${admin.masterId}`,
      action: "CREATE_MASTER_ADMIN",
      clientId: admin.clientId,
      companyName: admin.companyName,
      environment: "PROD",
      outcome: "SUCCESS",
    });
    showToast(`Master Admin ${admin.name} created for ${admin.companyName}.`);
  };

  // Update master admin status
  const updateMasterAdminStatus = (masterId: string, status: MasterAdmin["status"]) => {
    setMasterAdmins((prev) => prev.map((m) => (m.masterId === masterId ? { ...m, status } : m)));
    const target = masterAdmins.find((m) => m.masterId === masterId);
    addAuditLog({
      requestId: `REQ-${Date.now()}`,
      actorEmail: "superadmin@faceattend.io",
      actorRole: "SUPER_ADMIN",
      targetResource: `masterAdmins/${masterId}`,
      action: `UPDATE_MASTER_STATUS_${status}`,
      clientId: target?.clientId,
      companyName: target?.companyName,
      environment: "PROD",
      outcome: "SUCCESS",
    });
    showToast(`Master Admin ${masterId} status set to ${status}.`);
  };

  // Provision token
  const provisionToken = (tokenData: Omit<ApiTokenRecord, "createdAt" | "consumedQuota" | "remainingQuota" | "status" | "tokenHash">) => {
    const rawSecret = `${tokenData.environment.toLowerCase()}_${Math.random().toString(36).substring(2, 12)}_${Math.random().toString(36).substring(2, 12)}`;
    const masked = `${tokenData.environment.toLowerCase()}_${rawSecret.substring(4, 12)}**********${Math.floor(1000 + Math.random() * 9000)}`;
    const newToken: ApiTokenRecord = {
      ...tokenData,
      maskedToken: masked,
      tokenHash: `sha256_${Math.random().toString(36).substring(2, 15)}`,
      consumedQuota: 0,
      remainingQuota: tokenData.allocatedQuota,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
    setTokens((prev) => [newToken, ...prev]);
    addAuditLog({
      requestId: `REQ-${Date.now()}`,
      actorEmail: "superadmin@faceattend.io",
      actorRole: "SUPER_ADMIN",
      targetResource: `tokens/${newToken.tokenId}`,
      action: "PROVISION_TOKEN",
      clientId: newToken.clientId,
      companyName: newToken.companyName,
      environment: newToken.environment,
      outcome: "SUCCESS",
      metadata: { allocated: newToken.allocatedQuota },
    });
    showToast(`Token ${newToken.tokenId} issued for ${newToken.companyName}.`);
    return { tokenId: newToken.tokenId, rawSecret };
  };

  // Rotate token
  const rotateToken = (tokenId: string) => {
    const target = tokens.find((t) => t.tokenId === tokenId);
    if (!target) return null;
    const rawSecret = `${target.environment.toLowerCase()}_${Math.random().toString(36).substring(2, 12)}_${Math.random().toString(36).substring(2, 12)}`;
    const newMasked = `${target.environment.toLowerCase()}_${rawSecret.substring(4, 12)}**********${Math.floor(1000 + Math.random() * 9000)}`;

    setTokens((prev) =>
      prev.map((t) =>
        t.tokenId === tokenId
          ? {
              ...t,
              maskedToken: newMasked,
              tokenHash: `sha256_${Math.random().toString(36).substring(2, 15)}`,
              createdAt: new Date().toISOString(),
            }
          : t
      )
    );
    addAuditLog({
      requestId: `REQ-${Date.now()}`,
      actorEmail: "superadmin@faceattend.io",
      actorRole: "SUPER_ADMIN",
      targetResource: `tokens/${tokenId}`,
      action: "ROTATE_TOKEN_SECRET",
      clientId: target.clientId,
      companyName: target.companyName,
      environment: target.environment,
      outcome: "SUCCESS",
    });
    showToast(`Token ${tokenId} secret rotated. Previous secret invalidated immediately.`);
    return { newMasked, rawSecret };
  };

  // Revoke token
  const revokeToken = (tokenId: string) => {
    setTokens((prev) => prev.map((t) => (t.tokenId === tokenId ? { ...t, status: "REVOKED" } : t)));
    const target = tokens.find((t) => t.tokenId === tokenId);
    addAuditLog({
      requestId: `REQ-${Date.now()}`,
      actorEmail: "superadmin@faceattend.io",
      actorRole: "SUPER_ADMIN",
      targetResource: `tokens/${tokenId}`,
      action: "REVOKE_TOKEN",
      clientId: target?.clientId,
      companyName: target?.companyName,
      environment: target?.environment || "UAT",
      outcome: "SUCCESS",
    });
    showToast(`Token ${tokenId} revoked. Subsequent requests will return HTTP 401 Unauthorized.`);
  };

  // Search request
  const searchRequest = (requestId: string) => {
    const trimmed = requestId.trim();
    return requestTraces[trimmed] || null;
  };

  // Toggle API endpoint status
  const toggleEndpointStatus = (id: string) => {
    setApiEndpoints((prev) =>
      prev.map((ep) => (ep.id === id ? { ...ep, isEnabled: !ep.isEnabled, lastUpdated: new Date().toISOString() } : ep))
    );
    const target = apiEndpoints.find((ep) => ep.id === id);
    const newStatus = !target?.isEnabled;
    addAuditLog({
      requestId: `REQ-${Date.now()}`,
      actorEmail: "superadmin@faceattend.io",
      actorRole: "SUPER_ADMIN",
      targetResource: `apiEndpoints/${target?.endpoint}`,
      action: newStatus ? "ENABLE_API_ENDPOINT" : "DISABLE_API_ENDPOINT",
      environment: target?.environment || "PROD",
      outcome: "SUCCESS",
    });
    showToast(`Endpoint ${target?.endpoint} is now ${newStatus ? "ENABLED" : "DISABLED"}.`);
  };

  // Update feature flag
  const updateClientFeatureFlag = (
    clientId: string,
    flagName: keyof ClientTenant["enabledFeatures"],
    value: boolean
  ) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.clientId === clientId) {
          return {
            ...c,
            enabledFeatures: {
              ...c.enabledFeatures,
              [flagName]: value,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
    addAuditLog({
      requestId: `REQ-${Date.now()}`,
      actorEmail: "superadmin@faceattend.io",
      actorRole: "SUPER_ADMIN",
      targetResource: `clients/${clientId}/features/${flagName}`,
      action: "TOGGLE_FEATURE_FLAG",
      clientId,
      environment: "PROD",
      outcome: "SUCCESS",
      metadata: { flag: flagName, value },
    });
    showToast(`Feature ${flagName} set to ${value ? "ENABLED" : "DISABLED"} for client ${clientId}.`);
  };

  return (
    <PortalContext.Provider
      value={{
        isDark,
        toggleTheme,
        selectedEnv,
        setSelectedEnv,
        clients,
        addClient,
        updateClientStatus,
        masterAdmins,
        addMasterAdmin,
        updateMasterAdminStatus,
        employees,
        tokens,
        provisionToken,
        rotateToken,
        revokeToken,
        requestTraces,
        searchRequest,
        auditLogs,
        addAuditLog,
        errorLogs,
        apiEndpoints,
        toggleEndpointStatus,
        updateClientFeatureFlag,
        systemHealth,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error("usePortal must be used within a PortalProvider");
  }
  return context;
}
