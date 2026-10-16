// Deterministic SAMPLE dataset for UI preview only. Nothing here comes from a
// real tenant; the UI labels every screen backed by this data as sample data.

import type { AttendanceRecord, AttendanceStatus, Department, Employee, EmployeeStatus } from "../types";

export const SAMPLE_DEPARTMENTS: Department[] = [
  { departmentId: "dept_eng", name: "Engineering" },
  { departmentId: "dept_ops", name: "Operations" },
  { departmentId: "dept_hr", name: "People & HR" },
  { departmentId: "dept_fin", name: "Finance" },
  { departmentId: "dept_sales", name: "Sales" },
];

const FIRST = ["Aarav", "Diya", "Rohan", "Ananya", "Vikram", "Meera", "Kiran", "Sneha", "Arjun", "Pooja", "Rahul", "Kavya", "Nikhil", "Isha", "Sanjay", "Lakshmi"];
const LAST = ["Patil", "Sharma", "Rao", "Kulkarni", "Reddy", "Iyer", "Desai", "Naik", "Joshi", "Hegde", "Menon", "Gowda"];
const TITLES: Record<string, string[]> = {
  dept_eng: ["Software Engineer", "Senior Engineer", "QA Engineer", "Engineering Manager"],
  dept_ops: ["Operations Executive", "Shift Supervisor", "Facilities Lead"],
  dept_hr: ["HR Executive", "Talent Partner"],
  dept_fin: ["Accountant", "Finance Analyst"],
  dept_sales: ["Sales Executive", "Account Manager", "Regional Sales Lead"],
};

/** Small seeded PRNG (mulberry32) so the sample data is stable between reloads. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isWorkingDay(isoDate: string): boolean {
  const day = new Date(`${isoDate}T00:00:00`).getDay();
  return day !== 0 && day !== 6;
}

export function buildSampleEmployees(): Employee[] {
  const r = rng(42);
  const employees: Employee[] = [];
  for (let i = 0; i < 48; i++) {
    const dept = SAMPLE_DEPARTMENTS[i % SAMPLE_DEPARTMENTS.length];
    const first = FIRST[Math.floor(r() * FIRST.length)];
    const last = LAST[Math.floor(r() * LAST.length)];
    const titles = TITLES[dept.departmentId];
    let status: EmployeeStatus = "ACTIVE";
    if (i % 9 === 4) status = "PENDING_FACE_REGISTRATION";
    if (i % 16 === 11) status = "TERMINATED";
    const registered = status !== "PENDING_FACE_REGISTRATION";
    const created = new Date(2026, 0, 5 + i * 4);
    employees.push({
      employeeId: `EMP-${1001 + i}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i}@sample.local`.toLowerCase(),
      phone: `+91 90000 ${String(10000 + i * 137).slice(-5)}`,
      departmentId: dept.departmentId,
      departmentName: dept.name,
      designation: titles[Math.floor(r() * titles.length)],
      status,
      faceId: registered ? `FACE_sample_${1001 + i}` : undefined,
      faceEncodingId: registered ? 200 + i : undefined,
      faceRegisteredAt: registered ? new Date(created.getTime() + 86400000 * 2).toISOString() : undefined,
      biometricConsentGiven: registered,
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    });
  }
  return employees;
}

/**
 * Builds attendance for active, face-registered employees over the given
 * window of working days. `now` decides which of today's punches are still
 * open (no check-out yet).
 */
export function buildSampleAttendance(employees: Employee[], days: number, now: Date): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = toIsoDate(now);
  const punching = employees.filter((e) => e.status === "ACTIVE" && e.faceId);

  for (let offset = days - 1; offset >= 0; offset--) {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    const date = toIsoDate(d);
    if (!isWorkingDay(date)) continue;
    const isToday = date === today;

    for (const emp of punching) {
      const r = rng(hash(`${emp.employeeId}|${date}`));
      const roll = r();
      if (roll < 0.08) continue; // absent

      const late = roll > 0.86;
      const inMin = late ? 9 * 60 + 16 + Math.floor(r() * 50) : 8 * 60 + 35 + Math.floor(r() * 40);
      const workMin = 480 + Math.floor(r() * 75);
      const outMin = inMin + workMin;
      const openToday = isToday && now.getHours() * 60 + now.getMinutes() < outMin;
      const forgotCheckout = !isToday && r() < 0.025;
      const status: AttendanceStatus = late ? "LATE" : "PRESENT";
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (isToday && nowMin < inMin) continue; // has not arrived yet

      records.push({
        attendanceId: `att_${date.replaceAll("-", "")}_${emp.employeeId}`,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        departmentName: emp.departmentName,
        attendanceDate: date,
        checkInTime: `${pad(Math.floor(inMin / 60))}:${pad(inMin % 60)}:${pad(Math.floor(r() * 60))}`,
        checkOutTime: openToday || forgotCheckout ? undefined : `${pad(Math.floor(outMin / 60))}:${pad(outMin % 60)}:${pad(Math.floor(r() * 60))}`,
        activeMinutes: openToday || forgotCheckout ? undefined : workMin,
        status,
        locationVerified: r() > 0.04,
        locationName: "Sample HQ",
        requestId: `REQ-${date.replaceAll("-", "")}-${String(hash(emp.employeeId + date) % 1000000).padStart(6, "0")}`,
      });
    }
  }
  return records;
}
