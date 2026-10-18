"use client";

import { useState } from "react";
import Link from "next/link";
import { ScanFace } from "lucide-react";
import { Card, PageHeader } from "@/components/ds/Card";
import { Button, ButtonLink } from "@/components/ds/Button";
import { DataTable, Pagination, type Column } from "@/components/ds/DataTable";
import { EmployeeStatusBadge, FaceStatusBadge } from "@/components/ds/StatusBadge";
import { FilterSelect, SearchInput } from "@/components/ds/Field";
import { EmptyState, ErrorState, SampleDataBanner } from "@/components/ds/States";
import { dataService, type Employee, type EmployeeQuery, type FaceRegistrationStatus } from "@/services";
import { formatDate } from "@/lib/format";
import { useDebounced } from "@/lib/useDebounced";
import { useServiceQuery } from "@/lib/useServiceQuery";

const PAGE_SIZE = 10;

const fetchDepartments = () => dataService.listDepartments();
const fetchEmployees = (q: EmployeeQuery) => dataService.listEmployees(q);

export const registerHref = (employeeId: string) => `/app/face-registration/${encodeURIComponent(employeeId)}`;

const columns: Column<Employee>[] = [
  {
    key: "name",
    header: "Employee",
    cell: (e) => (
      <div className="min-w-0">
        <Link href={`/app/employees/${encodeURIComponent(e.employeeId)}`} className="block truncate font-medium text-ink hover:text-primary">
          {e.name}
        </Link>
        <p className="truncate text-xs text-ink-muted">
          <span className="font-mono">{e.employeeId}</span>
          <span className="md:hidden"> · {e.departmentName}</span>
        </p>
      </div>
    ),
  },
  { key: "dept", header: "Department", cell: (e) => e.departmentName, hideBelow: "md" },
  { key: "status", header: "Status", cell: (e) => <EmployeeStatusBadge status={e.status} />, hideBelow: "sm" },
  {
    key: "face",
    header: "Face",
    hideBelow: "lg",
    cell: (e) => (
      <div className="space-y-0.5">
        <FaceStatusBadge registered={Boolean(e.faceId)} />
        {e.faceRegisteredAt && <p className="text-xs text-ink-muted">{formatDate(e.faceRegisteredAt)}</p>}
      </div>
    ),
  },
  {
    key: "action",
    header: "Action",
    className: "text-right",
    cell: (e) =>
      e.status === "TERMINATED" ? (
        <span className="text-xs text-ink-muted">Inactive</span>
      ) : (
        <ButtonLink href={registerHref(e.employeeId)} variant={e.faceId ? "ghost" : "secondary"} size="sm">
          <ScanFace className="h-3.5 w-3.5" aria-hidden />
          {e.faceId ? "Re-register" : "Register"}
          <span className="sr-only"> face for {e.name}</span>
        </ButtonLink>
      ),
  },
];

export function FaceRegistrationListView() {
  const [search, setSearchRaw] = useState("");
  const debouncedSearch = useDebounced(search, 250);
  const [departmentId, setDepartmentIdRaw] = useState("");
  // Most visits are to work through the backlog, so start there.
  const [faceStatus, setFaceStatusRaw] = useState<"" | FaceRegistrationStatus>("NOT_REGISTERED");
  const [page, setPage] = useState(1);

  const resetting =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };
  const setSearch = resetting(setSearchRaw);
  const setDepartmentId = resetting(setDepartmentIdRaw);
  const setFaceStatus = resetting(setFaceStatusRaw);

  const departments = useServiceQuery(fetchDepartments, null).data ?? [];
  const query: EmployeeQuery = {
    search: debouncedSearch || undefined,
    departmentId: departmentId || undefined,
    faceStatus: faceStatus || undefined,
    page,
    pageSize: PAGE_SIZE,
  };
  const { data: result, previousData, loading, errorMessage: error, refetch } = useServiceQuery(fetchEmployees, query);
  const total = (result ?? previousData)?.total ?? 0;

  const backlogOnly = faceStatus === "NOT_REGISTERED" && !debouncedSearch && !departmentId;

  return (
    <>
      <PageHeader
        title="Face registration"
        description="Register employees' faces, with their consent, so they can check in with face recognition."
      />

      {dataService.kind === "sample" && <SampleDataBanner />}

      <Card>
        <div className="grid gap-2 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
          <SearchInput label="Search employees" value={search} onChange={setSearch} placeholder="Search name, ID, email or designation" />
          <FilterSelect
            label="Department"
            value={departmentId}
            onChange={setDepartmentId}
            options={[{ value: "", label: "All departments" }, ...departments.map((d) => ({ value: d.departmentId, label: d.name }))]}
          />
          <FilterSelect
            label="Face registration"
            value={faceStatus}
            onChange={(v) => setFaceStatus(v as typeof faceStatus)}
            options={[
              { value: "NOT_REGISTERED", label: "Not registered" },
              { value: "REGISTERED", label: "Face registered" },
              { value: "", label: "Any face status" },
            ]}
          />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <>
            <DataTable
              caption="Employees and their face registration status"
              columns={columns}
              rows={result?.items ?? []}
              rowKey={(e) => e.employeeId}
              loading={loading}
              skeletonRows={PAGE_SIZE}
              empty={
                backlogOnly ? (
                  <EmptyState
                    icon={ScanFace}
                    title="Everyone is registered"
                    message="All employees have a registered face. New employees will appear here until they are registered."
                  />
                ) : (
                  <EmptyState
                    title="No employees match your filters"
                    message="Try a different search term or clear the filters."
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSearch("");
                          setDepartmentId("");
                          setFaceStatus("");
                        }}
                      >
                        Clear filters
                      </Button>
                    }
                  />
                )
              }
            />
            {total > 0 && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} label="employees" />}
          </>
        )}
      </Card>
    </>
  );
}
