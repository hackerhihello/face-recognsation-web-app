"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ds/Button";
import { Dialog } from "@/components/ds/Dialog";
import { Field, Input, Select } from "@/components/ds/Field";
import { ServiceError, dataService, type Department, type Employee, type EmployeeInput } from "@/services";
import { errorMessage } from "@/lib/format";

type Values = Required<Omit<EmployeeInput, "phone">> & { phone: string };
type Errors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = { employeeId: "", name: "", email: "", phone: "", departmentId: "", designation: "" };

// Employee ID is sent to the Face API as `emp_id`, so keep it to safe characters.
const EMP_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{1,31}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[0-9][0-9 ()-]{6,19}$/;

export function validateEmployee(v: Values): Errors {
  const e: Errors = {};
  if (!v.employeeId.trim()) e.employeeId = "Employee ID is required.";
  else if (!EMP_ID.test(v.employeeId.trim()))
    e.employeeId = "Use 2–32 letters, numbers, hyphens or underscores, starting with a letter or number.";
  if (v.name.trim().length < 2) e.name = "Enter the employee's full name.";
  else if (v.name.trim().length > 100) e.name = "Name must be 100 characters or fewer.";
  if (!EMAIL.test(v.email.trim())) e.email = "Enter a valid email address.";
  if (v.phone.trim() && !PHONE.test(v.phone.trim())) e.phone = "Enter a valid phone number.";
  if (!v.departmentId) e.departmentId = "Select a department.";
  if (v.designation.trim().length < 2) e.designation = "Designation is required.";
  else if (v.designation.trim().length > 80) e.designation = "Designation must be 80 characters or fewer.";
  return e;
}

export function EmployeeFormDialog({
  open,
  onClose,
  onSaved,
  departments,
  employee,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (employee: Employee) => void;
  departments: Department[];
  /** When set, the dialog edits this employee; otherwise it creates one. */
  employee?: Employee | null;
}) {
  const editing = Boolean(employee);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      employee
        ? {
            employeeId: employee.employeeId,
            name: employee.name,
            email: employee.email,
            phone: employee.phone ?? "",
            departmentId: employee.departmentId,
            designation: employee.designation,
          }
        : EMPTY,
    );
    setErrors({});
    setSubmitError(null);
  }, [open, employee]);

  const set = (key: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateEmployee(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        departmentId: values.departmentId,
        designation: values.designation.trim(),
      };
      const saved = employee
        ? await dataService.updateEmployee(employee.employeeId, payload)
        : await dataService.createEmployee({ ...payload, employeeId: values.employeeId.trim() });
      onSaved(saved);
    } catch (err) {
      if (err instanceof ServiceError && err.code === "CONFLICT") {
        setErrors((er) => ({ ...er, employeeId: err.message }));
      } else {
        setSubmitError(errorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      title={editing ? "Edit employee" : "Add employee"}
      description={
        editing ? "Update profile details. The employee ID cannot be changed." : "New employees start as pending until their face is registered."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="employee-form" loading={saving}>
            {editing ? "Save changes" : "Add employee"}
          </Button>
        </>
      }
    >
      <form id="employee-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {submitError && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2">
            {submitError}
          </p>
        )}
        <Field label="Employee ID" required error={errors.employeeId} hint={editing ? undefined : "Used as emp_id for face registration"}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              data-field="employeeId"
              data-autofocus={!editing || undefined}
              value={values.employeeId}
              onChange={set("employeeId")}
              disabled={editing}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              autoComplete="off"
              placeholder="EMP-1050"
            />
          )}
        </Field>
        <Field label="Full name" required error={errors.name}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              data-field="name"
              data-autofocus={editing || undefined}
              value={values.name}
              onChange={set("name")}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Work email" required error={errors.email}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              data-field="email"
              type="email"
              value={values.email}
              onChange={set("email")}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Phone" error={errors.phone}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              data-field="phone"
              type="tel"
              value={values.phone}
              onChange={set("phone")}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Department" required error={errors.departmentId}>
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              data-field="departmentId"
              value={values.departmentId}
              onChange={set("departmentId")}
              aria-invalid={invalid}
              aria-describedby={describedBy}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Designation" required error={errors.designation}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              data-field="designation"
              value={values.designation}
              onChange={set("designation")}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              autoComplete="off"
            />
          )}
        </Field>
      </form>
    </Dialog>
  );
}
