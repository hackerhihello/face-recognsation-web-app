"use client";

import React, { useState } from "react";
import { useClientPortal } from "@/lib/clientPortalStore";
import {
  Briefcase,
  Plus,
  Users,
  Search,
  Building2,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export default function DepartmentsPage() {
  const { departments, employees, addDepartment, showToast } = useClientPortal();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showToast("Department name is required.");
      return;
    }
    addDepartment(name, managerName || undefined);
    setIsAddOpen(false);
    setName("");
    setManagerName("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Departments & Teams
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              Workforce Org Chart
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize teams, assign department managers, and monitor employee headcount across functional groups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Department
          </button>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepts.map((dept) => {
          const deptEmployees = employees.filter((e) => e.departmentId === dept.departmentId || e.departmentName === dept.name);
          const enrolledCount = deptEmployees.filter((e) => e.faceId).length;

          return (
            <div
              key={dept.departmentId}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center font-bold">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {dept.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">
                        {dept.departmentId}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-400">Department Lead:</span>
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
                      {dept.managerName || "Not Designated"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-400">Assigned Headcount:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {deptEmployees.length} staff
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Face Vector Enrolled:</span>
                    <span className="font-semibold text-emerald-500">
                      {enrolledCount} / {deptEmployees.length} ({deptEmployees.length > 0 ? Math.round((enrolledCount / deptEmployees.length) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => showToast(`Department ${dept.name} settings updated.`)}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold text-xs"
                >
                  Manage Roster
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Corporate Department"
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Quality Assurance & Testing"
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department Manager / Lead
            </label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="e.g. David Kim"
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
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
              Create Department
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
