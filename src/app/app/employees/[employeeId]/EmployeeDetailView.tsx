"use client";

import { useState } from "react";
import { ArrowLeft, CalendarDays, Pencil, ScanFace, UserX, UserCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/ds/Card";
import { Button, ButtonLink } from "@/components/ds/Button";
import { ConfirmDialog } from "@/components/ds/Dialog";
import { DataTable, type Column } from "@/components/ds/DataTable";
import { AttendanceStatusBadge, EmployeeStatusBadge, FaceStatusBadge } from "@/components/ds/StatusBadge";
import { EmptyState, ErrorState, SampleDataBanner, Skeleton } from "@/components/ds/States";
import { useToast } from "@/components/ds/Toast";
import { useCan } from "@/components/shell/SessionContext";
import { ServiceError, dataService, type AttendanceRecord, type Employee } from "@/services";
import { errorMessage, formatDate, formatDuration, formatTime, todayIso } from "@/lib/format";
import { useServiceQuery } from "@/lib/useServiceQuery";
import { EmployeeFormDialog } from "../EmployeeFormDialog";

const fetchDepartments = () => dataService.listDepartments();
const fetchEmployeeDetail = async (employeeId: string) => {
  const [employee, history] = await Promise.all([
    dataService.getEmployee(employeeId),
    dataService.listEmployeeAttendance(employeeId, 30),
  ]);
  return { employee, history };
};

const historyColumns: Column<AttendanceRecord>[] = [
  { key: "date", header: "Date", cell: (r) => formatDate(r.attendanceDate, { weekday: "short", day: "numeric", month: "short" }) },
  { key: "in", header: "Check-in", cell: (r) => <span className="tabular-nums">{formatTime(r.checkInTime)}</span> },
  {
    key: "out",
    header: "Check-out",
    cell: (r) =>
      r.checkOutTime ? (
        <span className="tabular-nums">{formatTime(r.checkOutTime)}</span>
      ) : r.attendanceDate === todayIso() ? (
        <span className="text-ink-muted">Open</span>
      ) : (
        <span className="text-warning">Missing</span>
      ),
  },
  { key: "dur", header: "Duration", cell: (r) => <span className="tabular-nums">{formatDuration(r.activeMinutes)}</span>, hideBelow: "sm" },
  { key: "status", header: "Status", cell: (r) => <AttendanceStatusBadge status={r.status} /> },
  {
    key: "loc",
    header: "Location",
    hideBelow: "md",
    cell: (r) => (r.locationVerified === undefined ? "—" : r.locationVerified ? "Verified" : <span className="text-warning">Not verified</span>),
  },
  { key: "req", header: "Request ID", cell: (r) => <span className="font-mono text-xs">{r.requestId}</span>, hideBelow: "lg" },
];

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

export function EmployeeDetailView({ employeeId }: { employeeId: string }) {
  const canManage = useCan("employees.manage");
  const toast = useToast();
  const query = useServiceQuery(fetchEmployeeDetail, employeeId);
  const departments = useServiceQuery(fetchDepartments, null).data ?? [];
  // Holds the latest saved copy after an edit or status change.
  const [saved, setSaved] = useState<Employee | null>(null);
  const employee = saved ?? query.data?.employee ?? null;
  const history: AttendanceRecord[] = query.data?.history ?? [];
  const loading = query.loading;
  const load = query.refetch;
  const error = query.error
    ? { message: query.errorMessage ?? "", notFound: query.error instanceof ServiceError && query.error.code === "NOT_FOUND" }
    : null;
  const setEmployee = setSaved;

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const deactivating = employee?.status !== "TERMINATED";

  const changeStatus = async () => {
    if (!employee) return;
    setStatusSaving(true);
    try {
      // Reactivation returns to pending if no face is registered, matching the backend's status model.
      const next = deactivating ? "TERMINATED" : employee.faceId ? "ACTIVE" : "PENDING_FACE_REGISTRATION";
      const updated = await dataService.updateEmployee(employee.employeeId, { status: next });
      setEmployee(updated);
      setConfirmOpen(false);
      toast(deactivating ? `${updated.name} was deactivated.` : `${updated.name} was reactivated.`);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setStatusSaving(false);
    }
  };

  const back = (
    <ButtonLink href="/app/employees" variant="ghost" size="sm" className="-ml-2">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      All employees
    </ButtonLink>
  );

  if (error) {
    return (
      <>
        {back}
        <Card>
          {error.notFound ? (
            <EmptyState title="Employee not found" message={`No employee with ID ${employeeId} exists in your organization.`} />
          ) : (
            <ErrorState message={error.message} onRetry={load} />
          )}
        </Card>
      </>
    );
  }

  return (
    <>
      {back}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {loading || !employee ? (
            <>
              <Skeleton className="h-7 w-56" />
              <Skeleton className="mt-2 h-4 w-40" />
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{employee.name}</h1>
                <EmployeeStatusBadge status={employee.status} />
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                <span className="font-mono">{employee.employeeId}</span> · {employee.designation}
              </p>
            </>
          )}
        </div>
        {canManage && employee && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
              {deactivating ? <UserX className="h-4 w-4" aria-hidden /> : <UserCheck className="h-4 w-4" aria-hidden />}
              {deactivating ? "Deactivate" : "Reactivate"}
            </Button>
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              Edit details
            </Button>
          </div>
        )}
      </div>

      {dataService.kind === "sample" && <SampleDataBanner />}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Profile" />
          {loading || !employee ? (
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : (
            <dl className="grid gap-4 p-5 sm:grid-cols-2">
              <Detail label="Email">{employee.email}</Detail>
              <Detail label="Phone">{employee.phone ?? "—"}</Detail>
              <Detail label="Department">{employee.departmentName}</Detail>
              <Detail label="Designation">{employee.designation}</Detail>
              <Detail label="Added">{formatDate(employee.createdAt)}</Detail>
              <Detail label="Last updated">{formatDate(employee.updatedAt)}</Detail>
            </dl>
          )}
        </Card>

        <Card>
          <CardHeader title="Face registration" />
          <div className="space-y-4 p-5">
            {loading || !employee ? (
              <Skeleton className="h-20" />
            ) : (
              <>
                <FaceStatusBadge registered={Boolean(employee.faceId)} />
                {employee.faceId ? (
                  <dl className="space-y-3">
                    <Detail label="Registered on">{employee.faceRegisteredAt ? formatDate(employee.faceRegisteredAt) : "—"}</Detail>
                    <Detail label="Face encoding ID">
                      <span className="font-mono text-xs">{employee.faceEncodingId ?? "—"}</span>
                    </Detail>
                    <Detail label="Biometric consent">{employee.biometricConsentGiven ? "Recorded" : "Not recorded"}</Detail>
                  </dl>
                ) : (
                  <p className="text-sm text-ink-secondary">
                    This employee can&apos;t check in with face recognition until a face is registered with their consent.
                  </p>
                )}
                <Button variant="secondary" disabled className="w-full" title="Face registration screen is coming in the next increment">
                  <ScanFace className="h-4 w-4" aria-hidden />
                  {employee.faceId ? "Re-register face" : "Register face"}
                </Button>
                <p className="text-xs text-ink-muted">The face registration screen arrives in the next increment.</p>
              </>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Attendance history" description="Most recent 30 records" />
        <DataTable
          caption={`Attendance history for ${employee?.name ?? employeeId}`}
          columns={historyColumns}
          rows={history}
          rowKey={(r) => r.attendanceId}
          loading={loading}
          skeletonRows={5}
          empty={<EmptyState icon={CalendarDays} title="No attendance yet" message="Records appear after the employee's first check-in." />}
        />
      </Card>

      {canManage && employee && (
        <>
          <EmployeeFormDialog
            open={editOpen}
            employee={employee}
            departments={departments}
            onClose={() => setEditOpen(false)}
            onSaved={(saved) => {
              setEmployee(saved);
              setEditOpen(false);
              toast(`${saved.name} was updated.`);
            }}
          />
          <ConfirmDialog
            open={confirmOpen}
            busy={statusSaving}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={changeStatus}
            tone={deactivating ? "danger" : "primary"}
            title={deactivating ? `Deactivate ${employee.name}?` : `Reactivate ${employee.name}?`}
            confirmLabel={deactivating ? "Deactivate" : "Reactivate"}
            message={
              deactivating
                ? "They will no longer be able to check in or out. Their attendance history is kept, and you can reactivate them later."
                : "They will be able to check in again once their face registration is in place."
            }
          />
        </>
      )}
    </>
  );
}
