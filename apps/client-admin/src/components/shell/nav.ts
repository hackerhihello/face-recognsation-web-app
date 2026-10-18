import {
  BarChart3,
  Building2,
  CalendarCheck,
  LayoutDashboard,
  ScanFace,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/auth/roles";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
  /** false = planned screen; shown disabled so the roadmap is visible. */
  ready: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const CLIENT_NAV: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard, permission: "dashboard.view", ready: true }],
  },
  {
    title: "Workforce",
    items: [
      { label: "Employees", href: "/app/employees", icon: Users, permission: "employees.view", ready: true },
      { label: "Face registration", href: "/app/face-registration", icon: ScanFace, permission: "faces.register", ready: true },
      { label: "Departments", href: "/app/departments", icon: Building2, permission: "employees.manage", ready: false },
    ],
  },
  {
    title: "Attendance",
    items: [
      { label: "Attendance", href: "/app/attendance", icon: CalendarCheck, permission: "attendance.view", ready: false },
      { label: "Reports", href: "/app/reports", icon: BarChart3, permission: "reports.view", ready: false },
    ],
  },
  {
    title: "Administration",
    items: [{ label: "Settings", href: "/app/settings", icon: Settings, permission: "settings.manage", ready: false }],
  },
];

/** Human labels for breadcrumb segments. */
export const SEGMENT_LABELS: Record<string, string> = {
  app: "Home",
  dashboard: "Dashboard",
  employees: "Employees",
  "face-registration": "Face registration",
  departments: "Departments",
  attendance: "Attendance",
  reports: "Reports",
  settings: "Settings",
};
