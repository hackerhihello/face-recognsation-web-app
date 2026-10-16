"use client";

import React, { useState } from "react";
import { useClientPortal } from "@/lib/clientPortalStore";
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ShieldCheck,
  User,
  RefreshCw,
  FileText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function FaceRegistrationPage() {
  const { employees, enrollEmployeeFace, showToast } = useClientPortal();

  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    employees.find((e) => !e.faceId)?.employeeId || employees[0]?.employeeId || ""
  );
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enrollmentResult, setEnrollmentResult] = useState<{
    faceId: string;
    qualityScore: number;
    employeeName: string;
  } | null>(null);

  const selectedEmployee = employees.find((e) => e.employeeId === selectedEmpId);

  const handleSimulateCapture = () => {
    const sampleFaces = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    ];
    const picked = sampleFaces[Math.floor(Math.random() * sampleFaces.length)];
    setPhotoPreview(picked);
    showToast("Live camera frame captured with uniform illumination.");
  };

  const handleEnrollBiometrics = async () => {
    if (!selectedEmployee) {
      showToast("Please select an employee.");
      return;
    }
    if (!consentConfirmed) {
      showToast("Employee biometric consent verification is required.");
      return;
    }
    if (!photoPreview) {
      showToast("Please capture or upload an enrollment photo.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await enrollEmployeeFace(selectedEmpId, photoPreview);
      setEnrollmentResult({
        faceId: res.faceId,
        qualityScore: res.qualityScore,
        employeeName: selectedEmployee.name,
      });
      setPhotoPreview(null);
      setConsentConfirmed(false);
    } catch (err) {
      showToast("Biometric enrollment failed. Please check image sharpness.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Guided Face Registration Studio
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              Railway Engine + Cloudflare R2
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enroll high-fidelity 512-dimensional face vectors. Raw selfies are never permanently stored; only mathematical embeddings are saved in R2.
          </p>
        </div>
      </div>

      {/* Main Workflow Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm space-y-5">
          {/* Step 1: Select Employee */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Step 1: Select Employee for Registration
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => {
                setSelectedEmpId(e.target.value);
                setEnrollmentResult(null);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {employees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.name} ({emp.employeeId}) — {emp.departmentName} {emp.faceId ? "✓ [Already Enrolled]" : "⚠️ [Pending]"}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Department:</span>{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedEmployee.departmentName}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Current Status:</span>{" "}
                <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                  {selectedEmployee.faceId ? "Enrolled" : "Awaiting Face Vector"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Email:</span>{" "}
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {selectedEmployee.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Existing Face ID:</span>{" "}
                <span className="font-mono text-slate-500">
                  {selectedEmployee.faceId || "None"}
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Employee Consent */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="consent-check"
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="consent-check" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <strong>Step 2: Biometric Privacy Consent Verification</strong>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                  I confirm that the employee has signed the biometric privacy disclosure in compliance with GDPR / BIPA regulations, consenting to facial vector generation for workplace attendance verification.
                </p>
              </label>
            </div>
          </div>

          {/* Step 3: Photo Capture Controls */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Step 3: Capture Live Facial Portrait
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSimulateCapture}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
              >
                <Camera className="h-4 w-4" />
                Capture with Connected Camera
              </button>

              <button
                type="button"
                onClick={handleSimulateCapture}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              >
                <Upload className="h-4 w-4" />
                Upload Enrollment Photo
              </button>
            </div>
          </div>

          {/* Step 4: Submission */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Inference Target: Railway ONNX ArcFace Model
            </span>
            <button
              type="button"
              onClick={handleEnrollBiometrics}
              disabled={!consentConfirmed || !photoPreview || isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition shadow-md"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating 512-d Vector...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Compute & Register Vector
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Camera Viewfinder & Result Card */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Camera Viewfinder & Liveness Monitor
            </h3>

            <div className="aspect-square rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden flex items-center justify-center">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Captured Portrait"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 space-y-2">
                  <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    <User className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-slate-400 block font-medium">
                    Awaiting Live Capture
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Position subject with neutral expression and uniform lighting.
                  </span>
                </div>
              )}

              {/* Viewfinder Target Reticle */}
              <div className="absolute inset-6 border border-cyan-500/30 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="h-3 w-3 border-t-2 border-l-2 border-cyan-400" />
                  <div className="h-3 w-3 border-t-2 border-r-2 border-cyan-400" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-3 border-b-2 border-l-2 border-cyan-400" />
                  <div className="h-3 w-3 border-b-2 border-r-2 border-cyan-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Success Result Box */}
          {enrollmentResult && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4" />
                Biometrics Registered Successfully
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Face template for <strong>{enrollmentResult.employeeName}</strong> committed to Cloudflare R2 vault.
              </p>
              <div className="pt-2 text-xs font-mono space-y-1">
                <div>
                  <span className="text-slate-400">faceId:</span>{" "}
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                    {enrollmentResult.faceId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Quality Score:</span>{" "}
                  <span className="text-emerald-500 font-semibold">
                    {Math.round(enrollmentResult.qualityScore * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
