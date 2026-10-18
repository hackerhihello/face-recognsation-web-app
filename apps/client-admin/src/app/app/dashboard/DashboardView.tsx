"use client";

import { useState } from "react";
import Link from "next/link";
import { AlarmClock, CircleSlash, LogIn, LogOut, Percent, UserCheck, Users } from "lucide-react";
import { Card, CardHeader, PageHeader } from "@/components/ds/Card";
import { StatCard } from "@/components/ds/StatCard";
import { DataTable, type Column } from "@/components/ds/DataTable";
import { AttendanceStatusBadge } from "@/components/ds/StatusBadge";
import { FilterSelect, Input } from "@/components/ds/Field";
import { EmptyState, ErrorState, SampleDataBanner, Skeleton } from "@/components/ds/States";
import { BarChart } from "@/components/charts/BarChart";
import { dataService, type AttendanceRecord, type DashboardFilters } from "@/services";
import { useServiceQuery } from "@/lib/useServiceQuery";
import { formatDate, formatMonth, formatTime } from "@/lib/format";

const DAILY_SERIES = [
  { key: "present", label: "On time", color: "var(--color-chart-present)" },
  { key: "late", label: "Late", color: "var(--color-chart-late)" },
  { key: "absent", label: "Absent", color: "var(--color-chart-absent)" },
];

const MONTHLY_SERIES = [{ key: "rate", label: "Attendance rate", color: "var(--color-chart-primary)" }];

const activityColumns: Column<AttendanceRecord>[] = [
  {
    key: "employee",
    header: "Employee",
    cell: (r) => (
      <div className="min-w-0">
        <Link href={`/app/employees/${encodeURIComponent(r.employeeId)}`} className="font-medium text-ink hover:text-primary">
          {r.employeeName}
        </Link>
        <p className="text-xs text-ink-muted">{r.employeeId}</p>
      </div>
    ),
  },
  { key: "dept", header: "Department", cell: (r) => r.departmentName, hideBelow: "md" },
  { key: "date", header: "Date", cell: (r) => formatDate(r.attendanceDate, { day: "numeric", month: "short" }), hideBelow: "sm" },
  { key: "in", header: "Check-in", cell: (r) => <span className="tabular-nums">{formatTime(r.checkInTime)}</span> },
  {
    key: "out",
    header: "Check-out",
    cell: (r) => (r.checkOutTime ? <span className="tabular-nums">{formatTime(r.checkOutTime)}</span> : <span className="text-ink-muted">Open</span>),
    hideBelow: "sm",
  },
  { key: "status", header: "Status", cell: (r) => <AttendanceStatusBadge status={r.status} /> },
];

const fetchDepartments = () => dataService.listDepartments();
const fetchDashboard = (filters: DashboardFilters) => dataService.getDashboard(filters);

export function DashboardView({ initialDate }: { initialDate: string }) {
  const [date, setDate] = useState(initialDate);
  const [departmentId, setDepartmentId] = useState("");
  const departments = useServiceQuery(fetchDepartments, null).data ?? [];
  const {
    data,
    loading,
    errorMessage: error,
    refetch: load,
  } = useServiceQuery(fetchDashboard, { date, departmentId: departmentId || undefined });

  const s = data?.summary;
  const isToday = date === initialDate;
  const dayLabel = isToday ? "today" : `on ${formatDate(date, { day: "numeric", month: "short" })}`;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Attendance overview for your organization."
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <label className="sr-only" htmlFor="dash-date">
              Date
            </label>
            <Input
              id="dash-date"
              type="date"
              value={date}
              max={initialDate}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="w-full sm:w-44"
            />
            <FilterSelect
              label="Department"
              value={departmentId}
              onChange={setDepartmentId}
              className="w-full sm:w-48"
              options={[{ value: "", label: "All departments" }, ...departments.map((d) => ({ value: d.departmentId, label: d.name }))]}
            />
          </div>
        }
      />

      {dataService.kind === "sample" && <SampleDataBanner />}

      {error ? (
        <Card>
          <ErrorState message={error} onRetry={load} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-busy={loading}>
            <StatCard loading={loading} label="Total employees" value={s?.totalEmployees ?? 0} hint="Excludes inactive" icon={Users} />
            <StatCard
              loading={loading}
              label={`Present ${dayLabel}`}
              value={s?.presentToday ?? 0}
              hint="Includes late arrivals"
              icon={UserCheck}
              accent="text-success bg-success-soft"
            />
            <StatCard
              loading={loading}
              label={`Absent ${dayLabel}`}
              value={s?.absentToday ?? 0}
              hint="Active employees without a check-in"
              icon={CircleSlash}
              accent="text-danger bg-danger-soft"
            />
            <StatCard
              loading={loading}
              label="Late arrivals"
              value={s?.lateToday ?? 0}
              hint="After grace period"
              icon={AlarmClock}
              accent="text-warning bg-warning-soft"
            />
            <StatCard
              loading={loading}
              label="Checked in now"
              value={isToday ? (s?.checkedInNow ?? 0) : "—"}
              hint={isToday ? "No check-out yet" : "Only shown for today"}
              icon={LogIn}
            />
            <StatCard
              loading={loading}
              label="Missing check-outs"
              value={s?.missingCheckOuts ?? 0}
              hint="Previous 7 days"
              icon={LogOut}
              accent="text-warning bg-warning-soft"
            />
            <StatCard
              loading={loading}
              label="Attendance rate"
              value={`${s?.attendanceRate ?? 0}%`}
              hint={`Present ÷ active employees, ${dayLabel}`}
              icon={Percent}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-5">
            <Card className="xl:col-span-3">
              <CardHeader title="Daily attendance" description="Last 10 working days up to the selected date" />
              <div className="p-5">
                {loading || !data ? (
                  <Skeleton className="h-60 w-full" />
                ) : data.daily.length === 0 ? (
                  <EmptyState title="No working days in range" />
                ) : (
                  <BarChart
                    title="Daily attendance"
                    series={DAILY_SERIES}
                    data={data.daily.map((d) => ({
                      label: formatDate(d.date, { day: "numeric", month: "short" }),
                      fullLabel: formatDate(d.date, { weekday: "short", day: "numeric", month: "short" }),
                      values: { present: d.present, late: d.late, absent: d.absent },
                    }))}
                  />
                )}
              </div>
            </Card>
            <Card className="xl:col-span-2">
              <CardHeader title="Monthly attendance rate" description="Average daily attendance per month" />
              <div className="p-5">
                {loading || !data ? (
                  <Skeleton className="h-60 w-full" />
                ) : data.monthly.length === 0 ? (
                  <EmptyState title="No monthly data yet" />
                ) : (
                  <BarChart
                    title="Monthly attendance rate"
                    series={MONTHLY_SERIES}
                    yMax={100}
                    format={(v) => `${v}%`}
                    data={data.monthly.map((m) => ({
                      label: formatMonth(m.month),
                      fullLabel: formatMonth(m.month, "long"),
                      values: { rate: m.attendanceRate },
                    }))}
                  />
                )}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Recent attendance activity"
              description="Latest check-ins and check-outs"
              actions={
                <Link href="/app/employees" className="text-sm font-medium text-primary hover:text-primary-hover">
                  View employees
                </Link>
              }
            />
            <DataTable
              caption="Recent attendance activity"
              columns={activityColumns}
              rows={data?.recentActivity ?? []}
              rowKey={(r) => r.attendanceId}
              loading={loading}
              skeletonRows={5}
              empty={<EmptyState title="No attendance activity" message="Nobody has checked in for the selected filters yet." />}
            />
          </Card>
        </>
      )}
    </>
  );
}
