"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Users } from "lucide-react";
import { Card, PageHeader } from "@/components/ds/Card";
import { Button } from "@/components/ds/Button";
import { DataTable, Pagination, type Column } from "@/components/ds/DataTable";
import { EmployeeStatusBadge, FaceStatusBadge } from "@/components/ds/StatusBadge";
import { FilterSelect, SearchInput } from "@/components/ds/Field";
import { EmptyState, ErrorState, SampleDataBanner } from "@/components/ds/States";
import { useToast } from "@/components/ds/Toast";
import { useCan } from "@/components/shell/SessionContext";
import { dataService, type Employee, type EmployeeQuery, type EmployeeStatus, type FaceRegistrationStatus } from "@/services";
import { useDebounced } from "@/lib/useDebounced";
import { useServiceQuery } from "@/lib/useServiceQuery";
import { EmployeeFormDialog } from "./EmployeeFormDialog";

const PAGE_SIZE = 10;

const fetchDepartments = () => dataService.listDepartments();
const fetchEmployees = (q: EmployeeQuery) => dataService.listEmployees(q);

export function EmployeesView({ initialSearch }: { initialSearch: string }) {
  const canManage = useCan("employees.manage");
  const toast = useToast();

  const [search, setSearchRaw] = useState(initialSearch);
  const debouncedSearch = useDebounced(search, 250);
  const [departmentId, setDepartmentIdRaw] = useState("");
  const [status, setStatusRaw] = useState<"" | EmployeeStatus>("");
  const [faceStatus, setFaceStatusRaw] = useState<"" | FaceRegistrationStatus>("");
  const [page, setPage] = useState(1);

  // Any filter change returns to the first page.
  const resetting =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };
  const setSearch = resetting(setSearchRaw);
  const setDepartmentId = resetting(setDepartmentIdRaw);
  const setStatus = resetting(setStatusRaw);
  const setFaceStatus = resetting(setFaceStatusRaw);

  const departments = useServiceQuery(fetchDepartments, null).data ?? [];
  const query: EmployeeQuery = {
    search: debouncedSearch || undefined,
    departmentId: departmentId || undefined,
    status: status || undefined,
    faceStatus: faceStatus || undefined,
    page,
    pageSize: PAGE_SIZE,
  };
  const { data: result, previousData, loading, errorMessage: error, refetch: load } = useServiceQuery(fetchEmployees, query);
  // Keep the total stable while the next page loads so pagination doesn't jump.
  const total = (result ?? previousData)?.total ?? 0;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const hasFilters = Boolean(debouncedSearch || departmentId || status || faceStatus);
  const clearFilters = () => {
    setSearch("");
    setDepartmentId("");
    setStatus("");
    setFaceStatus("");
  };

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      cell: (e) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-ink" aria-hidden>
            {e.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div className="min-w-0">
            <Link href={`/app/employees/${encodeURIComponent(e.employeeId)}`} className="block truncate font-medium text-ink hover:text-primary">
              {e.name}
            </Link>
            <p className="truncate text-xs text-ink-muted">{e.email}</p>
          </div>
        </div>
      ),
    },
    { key: "id", header: "Employee ID", cell: (e) => <span className="font-mono text-xs text-ink">{e.employeeId}</span>, hideBelow: "sm" },
    {
      key: "dept",
      header: "Department",
      hideBelow: "md",
      cell: (e) => (
        <div>
          <p className="text-ink">{e.departmentName}</p>
          <p className="text-xs text-ink-muted">{e.designation}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (e) => <EmployeeStatusBadge status={e.status} /> },
    { key: "face", header: "Face", cell: (e) => <FaceStatusBadge registered={Boolean(e.faceId)} />, hideBelow: "lg" },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (e) =>
        canManage ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(e);
              setFormOpen(true);
            }}
            aria-label={`Edit ${e.name}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        ) : (
          <Link href={`/app/employees/${encodeURIComponent(e.employeeId)}`} className="text-sm font-medium text-primary hover:text-primary-hover">
            View
          </Link>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage your workforce and face-registration status."
        actions={
          canManage && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add employee
            </Button>
          )
        }
      />

      {dataService.kind === "sample" && <SampleDataBanner />}

      <Card>
        <div className="grid gap-2 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <SearchInput label="Search employees" value={search} onChange={setSearch} placeholder="Search name, ID, email or designation" />
          <FilterSelect
            label="Department"
            value={departmentId}
            onChange={setDepartmentId}
            options={[{ value: "", label: "All departments" }, ...departments.map((d) => ({ value: d.departmentId, label: d.name }))]}
          />
          <FilterSelect
            label="Employment status"
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
            options={[
              { value: "", label: "All statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "PENDING_FACE_REGISTRATION", label: "Pending face" },
              { value: "TERMINATED", label: "Inactive" },
            ]}
          />
          <FilterSelect
            label="Face registration"
            value={faceStatus}
            onChange={(v) => setFaceStatus(v as typeof faceStatus)}
            options={[
              { value: "", label: "Any face status" },
              { value: "REGISTERED", label: "Face registered" },
              { value: "NOT_REGISTERED", label: "Not registered" },
            ]}
          />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <>
            <DataTable
              caption="Employees"
              columns={columns}
              rows={result?.items ?? []}
              rowKey={(e) => e.employeeId}
              loading={loading}
              skeletonRows={PAGE_SIZE}
              empty={
                hasFilters ? (
                  <EmptyState
                    title="No employees match your filters"
                    message="Try a different search term or clear the filters."
                    action={
                      <Button variant="secondary" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No employees yet"
                    message="Add your first employee to start registering faces and tracking attendance."
                  />
                )
              }
            />
            {total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} label="employees" />}
          </>
        )}
      </Card>

      {canManage && (
        <EmployeeFormDialog
          open={formOpen}
          employee={editing}
          departments={departments}
          onClose={() => setFormOpen(false)}
          onSaved={(saved) => {
            setFormOpen(false);
            toast(editing ? `${saved.name} was updated.` : `${saved.name} was added. Register their face to activate attendance.`);
            load();
          }}
        />
      )}
    </>
  );
}
