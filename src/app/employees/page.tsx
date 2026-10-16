"use client";

import React, { useState } from "react";
import { useClientPortal } from "@/lib/clientPortalStore";
import { ClientEmployee } from "@/types/clientPortal";
import {
  Users,
  Search,
  Plus,
  Filter,
  Camera,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
  Mail,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";

export default function ClientEmployeesPage() {
  const {
    employees,
    departments,
    shifts,
    addEmployee,
    updateEmployee,
    removeEmployeeFace,
    showToast,
  } = useClientPortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterFaceStatus, setFilterFaceStatus] = useState("ALL");

  // Add Employee Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [empId, setEmpId] = useState("");
  const [deptId, setDeptId] = useState(departments[0]?.departmentId || "");
  const [designation, setDesignation] = useState("");
  const [shiftId, setShiftId] = useState(shifts[0]?.shiftId || "");

  // Detail / Drawer State
  const [inspectingEmp, setInspectingEmp] = useState<ClientEmployee | null>(null);

  // Purge Face Confirm State
  const [purgingEmp, setPurgingEmp] = useState<ClientEmployee | null>(null);
  const [purgeReason, setPurgeReason] = useState("");

  const filteredEmployees = employees.filter((emp) => {
    if (filterDept !== "ALL" && emp.departmentId !== filterDept) return false;
    if (filterFaceStatus === "REGISTERED" && !emp.faceId) return false;
    if (filterFaceStatus === "PENDING" && emp.faceId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.name.toLowerCase().includes(q);
      const matchId = emp.employeeId.toLowerCase().includes(q);
      const matchEmail = emp.email.toLowerCase().includes(q);
      const matchDept = emp.departmentName.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchEmail && !matchDept) return false;
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !empId) {
      showToast("Please fill in all required employee fields.");
      return;
    }

    const dept = departments.find((d) => d.departmentId === deptId);

    addEmployee({
      employeeId: empId.trim().toUpperCase(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      departmentId: deptId,
      departmentName: dept?.name || "General",
      designation: designation.trim() || "Staff Member",
      shiftId,
    });

    setIsAddOpen(false);
    setName("");
    setEmail("");
    setPhone("");
    setEmpId("");
    setDesignation("");
  };

  const handleConfirmPurgeFace = () => {
    if (purgingEmp) {
      removeEmployeeFace(purgingEmp.employeeId, purgeReason || "Administrator requested biometric reset");
      setPurgingEmp(null);
      setPurgeReason("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Employee Directory
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              Tenant Isolated
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage staff profiles, department memberships, shifts, and biometric face registration status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEmpId(`EMP${Math.floor(1000 + Math.random() * 9000)}`);
              setIsAddOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add New Employee
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, employee ID, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={filterFaceStatus}
              onChange={(e) => setFilterFaceStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Face Statuses</option>
              <option value="REGISTERED">Biometrics Enrolled</option>
              <option value="PENDING">Pending Enrollment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Employee ID & Name</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Contact Email</th>
                <th className="py-3 px-4">Face Status</th>
                <th className="py-3 px-4">Quality Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No employees found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.employeeId}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {emp.name}
                        </span>
                        <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                          {emp.employeeId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-800 dark:text-slate-200 font-medium block">
                        {emp.departmentName}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {emp.designation}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {emp.email}
                    </td>
                    <td className="py-3 px-4">
                      {emp.faceId ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Enrolled</span>
                        </div>
                      ) : (
                        <Link
                          href={`/face-registration?empId=${emp.employeeId}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold hover:bg-amber-500/20 transition"
                        >
                          <Camera className="h-3 w-3" />
                          Enroll Now
                        </Link>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {emp.faceQualityScore ? (
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {Math.round(emp.faceQualityScore * 100)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        variant={emp.status === "ACTIVE" ? "success" : "warning"}
                        label={emp.status}
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectingEmp(emp)}
                          className="px-2 py-1 rounded text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                        >
                          Details
                        </button>
                        {emp.faceId && (
                          <button
                            onClick={() => setPurgingEmp(emp)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 transition"
                            title="Remove Biometric Face Template"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Enroll New Employee Profile"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Elena Rostova"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Corporate Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="elena@company.com"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-019-0021"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              >
                {departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designation / Job Title
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Software Engineer"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Shift
            </label>
            <select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              {shifts.map((s) => (
                <option key={s.shiftId} value={s.shiftId}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
            >
              Create Employee Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Employee Detail Modal */}
      {inspectingEmp && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingEmp(null)}
          title={`Employee Profile — ${inspectingEmp.name}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block">Employee ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {inspectingEmp.employeeId}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Department:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {inspectingEmp.departmentName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Designation:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {inspectingEmp.designation}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Email:</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {inspectingEmp.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Face Biometric Status:</span>
                <span className="font-semibold text-emerald-500">
                  {inspectingEmp.faceId ? "Enrolled in R2 Vault" : "Pending Registration"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Opaque Face ID:</span>
                <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                  {inspectingEmp.faceId || "None"}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
              Biometric templates are stored securely in Cloudflare R2 as 512-dimensional floating-point embeddings. Raw facial photos are never retained.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInspectingEmp(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Purge Face Confirm Dialog */}
      {purgingEmp && (
        <Modal
          isOpen={true}
          onClose={() => setPurgingEmp(null)}
          title={`Confirm Biometric Vector Purge — ${purgingEmp.name}`}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Removing the biometric face vector will immediately deactivate facial attendance for {purgingEmp.name}. The employee will need to perform guided re-registration.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Removal (Required for Audit Trail)
              </label>
              <textarea
                rows={2}
                value={purgeReason}
                onChange={(e) => setPurgeReason(e.target.value)}
                placeholder="e.g. Employee changed appearance, false rejections reported, or employee requested privacy reset"
                className="w-full text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPurgingEmp(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurgeFace}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
              >
                Confirm Vector Deletion
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
