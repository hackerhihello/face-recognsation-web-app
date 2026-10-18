import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(isoOrEpoch: string | number | undefined): string {
  if (!isoOrEpoch) return "N/A";
  const date = typeof isoOrEpoch === "number" ? new Date(isoOrEpoch) : new Date(isoOrEpoch);
  if (isNaN(date.getTime())) return String(isoOrEpoch);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return "0";
  return num.toLocaleString();
}

export function maskSecret(secret: string, prefixLength = 6, suffixLength = 4): string {
  if (!secret) return "••••••••••••";
  if (secret.length <= prefixLength + suffixLength) return secret;
  const prefix = secret.slice(0, prefixLength);
  const suffix = secret.slice(-suffixLength);
  return `${prefix}${"*".repeat(10)}${suffix}`;
}

export function generateId(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${date}-${rand}`;
}
