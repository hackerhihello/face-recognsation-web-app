// In-memory adapter over the SAMPLE dataset. Writes live only in this browser
// tab and are lost on reload. Used for UI preview until the Convex adapter is
// connected behind authenticated, tenant-checked functions.

import {
  ServiceError,
  type AttendanceRecord,
  type DailyAttendancePoint,
  type DashboardData,
  type DashboardFilters,
  type DataService,
  type Employee,
  type EmployeeInput,
  type EmployeeQuery,
  type EmployeeUpdate,
  type MonthlyAttendancePoint,
  type Page,
} from "../types";
import { SAMPLE_DEPARTMENTS, buildSampleAttendance, buildSampleEmployees, isWorkingDay, toIsoDate } from "./sampleData";

const HISTORY_DAYS = 190;
const LATENCY_MS = 350;

let employees: Employee[] | null = null;
let attendance: AttendanceRecord[] | null = null;

function state() {
  if (!employees || !attendance) {
    employees = buildSampleEmployees();
    attendance = buildSampleAttendance(employees, HISTORY_DAYS, new Date());
  }
  return { employees, attendance };
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), LATENCY_MS));
}

function departmentName(departmentId: string): string {
  const dept = SAMPLE_DEPARTMENTS.find((d) => d.departmentId === departmentId);
  if (!dept) throw new ServiceError("Select a valid department.", "VALIDATION");
  return dept.name;
}

function shiftDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export const sampleAdapter: DataService = {
  kind: "sample",

  listDepartments() {
    return delay(SAMPLE_DEPARTMENTS);
  },

  getDashboard(filters: DashboardFilters): Promise<DashboardData> {
    const s = state();
    const inDept = (e: { departmentId: string }) => !filters.departmentId || e.departmentId === filters.departmentId;
    const deptName = filters.departmentId ? departmentName(filters.departmentId) : null;
    const recInDept = (r: AttendanceRecord) => !deptName || r.departmentName === deptName;

    const scopedEmployees = s.employees.filter(inDept);
    const expected = scopedEmployees.filter((e) => e.status === "ACTIVE").length;
    const records = s.attendance.filter(recInDept);

    const byDate = new Map<string, AttendanceRecord[]>();
    for (const r of records) {
      const list = byDate.get(r.attendanceDate) ?? [];
      list.push(r);
      byDate.set(r.attendanceDate, list);
    }

    const today = toIsoDate(new Date());
    const dayRecords = byDate.get(filters.date) ?? [];
    const present = dayRecords.length;
    const late = dayRecords.filter((r) => r.status === "LATE").length;
    const working = isWorkingDay(filters.date);
    const isPast = filters.date < today;

    // Open records on the 7 days before the selected date are missing check-outs.
    let missingCheckOuts = 0;
    for (let i = 1; i <= 7; i++) {
      const list = byDate.get(shiftDate(filters.date, -i)) ?? [];
      missingCheckOuts += list.filter((r) => !r.checkOutTime).length;
    }
    if (isPast) missingCheckOuts += dayRecords.filter((r) => !r.checkOutTime).length;

    const daily: DailyAttendancePoint[] = [];
    for (let i = 0, cursor = filters.date; daily.length < 10 && i < 30; i++, cursor = shiftDate(cursor, -1)) {
      if (!isWorkingDay(cursor) || cursor > today) continue;
      const list = byDate.get(cursor) ?? [];
      const lateCount = list.filter((r) => r.status === "LATE").length;
      daily.unshift({
        date: cursor,
        present: list.length - lateCount,
        late: lateCount,
        absent: Math.max(expected - list.length, 0),
      });
    }

    const monthly: MonthlyAttendancePoint[] = [];
    const anchor = new Date(`${filters.date}T00:00:00`);
    for (let m = 5; m >= 0; m--) {
      const monthDate = new Date(anchor.getFullYear(), anchor.getMonth() - m, 1);
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      let workingDays = 0;
      let punches = 0;
      for (const [date, list] of byDate) {
        if (date.startsWith(key) && date <= filters.date) {
          workingDays++;
          punches += list.length;
        }
      }
      if (workingDays === 0 || expected === 0) continue;
      monthly.push({ month: key, attendanceRate: Math.round((punches / (workingDays * expected)) * 1000) / 10 });
    }

    const recentActivity = records
      .filter((r) => r.attendanceDate <= filters.date)
      .sort((a, b) =>
        a.attendanceDate === b.attendanceDate
          ? (b.checkOutTime ?? b.checkInTime ?? "").localeCompare(a.checkOutTime ?? a.checkInTime ?? "")
          : b.attendanceDate.localeCompare(a.attendanceDate),
      )
      .slice(0, 8);

    return delay({
      summary: {
        totalEmployees: scopedEmployees.filter((e) => e.status !== "TERMINATED").length,
        presentToday: present,
        absentToday: working ? Math.max(expected - present, 0) : 0,
        lateToday: late,
        checkedInNow: filters.date === today ? dayRecords.filter((r) => !r.checkOutTime).length : 0,
        missingCheckOuts,
        attendanceRate: working && expected > 0 ? Math.round((present / expected) * 1000) / 10 : 0,
      },
      daily,
      monthly,
      recentActivity,
    });
  },

  listEmployees(query: EmployeeQuery): Promise<Page<Employee>> {
    const q = query.search?.trim().toLowerCase();
    let items = state().employees.filter((e) => {
      if (query.departmentId && e.departmentId !== query.departmentId) return false;
      if (query.status && e.status !== query.status) return false;
      if (query.faceStatus === "REGISTERED" && !e.faceId) return false;
      if (query.faceStatus === "NOT_REGISTERED" && e.faceId) return false;
      if (q) {
        return [e.name, e.employeeId, e.email, e.designation].some((v) => v.toLowerCase().includes(q));
      }
      return true;
    });
    items = items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const start = (query.page - 1) * query.pageSize;
    return delay({ items: items.slice(start, start + query.pageSize), total: items.length, page: query.page, pageSize: query.pageSize });
  },

  getEmployee(employeeId: string) {
    const emp = state().employees.find((e) => e.employeeId === employeeId);
    if (!emp) return Promise.reject(new ServiceError(`Employee ${employeeId} was not found.`, "NOT_FOUND"));
    return delay(emp);
  },

  createEmployee(input: EmployeeInput) {
    const s = state();
    const id = input.employeeId.trim();
    if (s.employees.some((e) => e.employeeId.toLowerCase() === id.toLowerCase())) {
      return Promise.reject(new ServiceError(`Employee ID ${id} already exists.`, "CONFLICT"));
    }
    const now = new Date().toISOString();
    const emp: Employee = {
      employeeId: id,
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || undefined,
      departmentId: input.departmentId,
      departmentName: departmentName(input.departmentId),
      designation: input.designation.trim(),
      // Matches backend createEmployee: new employees wait for face registration.
      status: "PENDING_FACE_REGISTRATION",
      biometricConsentGiven: false,
      createdAt: now,
      updatedAt: now,
    };
    s.employees.unshift(emp);
    return delay(emp);
  },

  updateEmployee(employeeId: string, update: EmployeeUpdate) {
    const s = state();
    const emp = s.employees.find((e) => e.employeeId === employeeId);
    if (!emp) return Promise.reject(new ServiceError(`Employee ${employeeId} was not found.`, "NOT_FOUND"));
    if (update.departmentId) emp.departmentName = departmentName(update.departmentId);
    Object.assign(emp, Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined)), {
      updatedAt: new Date().toISOString(),
    });
    return delay(emp);
  },

  listEmployeeAttendance(employeeId: string, limit: number) {
    const list = state()
      .attendance.filter((r) => r.employeeId === employeeId)
      .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate))
      .slice(0, limit);
    return delay(list);
  },
};
