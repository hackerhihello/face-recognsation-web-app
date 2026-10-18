"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, ArrowLeft, Check, CheckCircle2, RotateCcw, ScanFace, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ds/Card";
import { Button, ButtonLink } from "@/components/ds/Button";
import { EmployeeStatusBadge, FaceStatusBadge } from "@/components/ds/StatusBadge";
import { EmptyState, ErrorState, SampleDataBanner, Skeleton } from "@/components/ds/States";
import { useToast } from "@/components/ds/Toast";
import { CaptureTips, FaceCapture } from "@/components/face/FaceCapture";
import { useCan, useSession } from "@/components/shell/SessionContext";
import {
  ServiceError,
  dataService,
  type Employee,
  type FaceRegistrationResult,
  type FaceVerificationResult,
} from "@/services";
import { cn } from "@/lib/cn";
import { errorMessage, formatDate } from "@/lib/format";
import { formatBytes, type PreparedImage } from "@/lib/image";
import { useServiceQuery } from "@/lib/useServiceQuery";

type Step = "consent" | "photo" | "review" | "done";

const STEPS: { id: Exclude<Step, "done">; label: string }[] = [
  { id: "consent", label: "Consent" },
  { id: "photo", label: "Photo" },
  { id: "review", label: "Review and register" },
];

const fetchEmployee = (employeeId: string) => dataService.getEmployee(employeeId);

interface Failure {
  message: string;
  requestId?: string;
  /** Network or service problems are worth retrying with the same photo; rejections need a new one. */
  retrySamePhoto: boolean;
}

function toFailure(err: unknown): Failure {
  const code = err instanceof ServiceError ? err.code : "UNKNOWN";
  return {
    message: errorMessage(err),
    requestId: err instanceof ServiceError ? err.requestId : undefined,
    retrySamePhoto: code === "UNAVAILABLE" || code === "UNKNOWN",
  };
}

function Stepper({ current }: { current: Step }) {
  const index = current === "done" ? STEPS.length : STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="Registration steps">
      {STEPS.map((s, i) => {
        const done = i < index;
        const active = i === index;
        return (
          <li key={s.id} aria-current={active ? "step" : undefined} className="flex items-center gap-2 text-sm">
            {i > 0 && <span className="hidden h-px w-6 bg-line-strong sm:block" aria-hidden />}
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                done ? "bg-success text-white" : active ? "bg-primary text-white" : "bg-surface-sunken text-ink-muted",
              )}
              aria-hidden
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn(active ? "font-medium text-ink" : "text-ink-muted")}>
              {s.label}
              {done && <span className="sr-only"> (completed)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

function FailurePanel({ failure, children }: { failure: Failure; children: React.ReactNode }) {
  return (
    <div role="alert" className="space-y-3 rounded-lg border border-danger/30 bg-danger-soft p-4">
      <div className="flex items-start gap-2 text-sm text-danger">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div className="space-y-1">
          <p className="font-semibold">Registration didn&apos;t complete</p>
          <p>{failure.message}</p>
          {failure.requestId && (
            <p className="text-xs">
              Request ID: <span className="font-mono">{failure.requestId}</span>
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** Advisory only: the face service makes the real decision. */
function ImageWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="space-y-1.5 rounded-lg bg-warning-soft px-3 py-2.5 text-sm text-warning">
      {warnings.map((w) => (
        <li key={w} className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {w}
        </li>
      ))}
    </ul>
  );
}

function useElapsedSeconds(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => {
      clearInterval(t);
      setSeconds(0);
    };
  }, [running]);
  return seconds;
}

/** Warn before closing the tab while a request is in flight. */
function useLeaveGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);
}

export function FaceRegistrationWizard({ employeeId }: { employeeId: string }) {
  const session = useSession();
  const canVerify = useCan("attendance.view");
  const toast = useToast();
  const query = useServiceQuery(fetchEmployee, employeeId);
  const [saved, setSaved] = useState<Employee | null>(null);
  const employee = saved ?? query.data ?? null;

  const [step, setStep] = useState<Step>("consent");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [image, setImage] = useState<PreparedImage | null>(null);
  // One key per photo: retrying the same photo can't enroll it twice.
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [result, setResult] = useState<FaceRegistrationResult | null>(null);
  const elapsed = useElapsedSeconds(submitting);
  useLeaveGuard(submitting);

  const consentId = useId();
  const consentErrorId = useId();

  // Move focus to the new step's heading so keyboard and screen-reader users follow along.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const reRegistering = Boolean(query.data?.faceId);

  const acceptPhoto = (img: PreparedImage) => {
    setImage(img);
    setIdempotencyKey(crypto.randomUUID());
    setFailure(null);
    setStep("review");
  };

  const retake = () => {
    setImage(null);
    setFailure(null);
    setStep("photo");
  };

  const submit = async () => {
    if (!image || !employee) return;
    setSubmitting(true);
    setFailure(null);
    try {
      const r = await dataService.registerFace({
        employeeId: employee.employeeId,
        imageDataUrl: image.dataUrl,
        consentConfirmed: true,
        idempotencyKey,
      });
      setResult(r);
      setSaved({
        ...employee,
        status: "ACTIVE",
        faceId: r.faceId,
        faceEncodingId: r.faceEncodingId,
        faceRegisteredAt: r.registeredAt,
        biometricConsentGiven: true,
      });
      // The photo is no longer needed once the face service has it.
      setImage(null);
      setStep("done");
      toast(`${employee.name}'s face was registered.`);
    } catch (err) {
      setFailure(toFailure(err));
    } finally {
      setSubmitting(false);
    }
  };

  const back = (
    <ButtonLink href="/app/face-registration" variant="ghost" size="sm" className="-ml-2">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Face registration
    </ButtonLink>
  );

  if (query.error) {
    const notFound = query.error instanceof ServiceError && query.error.code === "NOT_FOUND";
    return (
      <>
        {back}
        <Card>
          {notFound ? (
            <EmptyState title="Employee not found" message={`No employee with ID ${employeeId} exists in your organization.`} />
          ) : (
            <ErrorState message={query.errorMessage ?? ""} onRetry={query.refetch} />
          )}
        </Card>
      </>
    );
  }

  const heading = (text: string) => (
    <h2 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-ink focus:outline-none">
      {text}
    </h2>
  );

  return (
    <>
      {back}

      <div className="min-w-0">
        {!employee ? (
          <>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="mt-2 h-4 w-48" />
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {reRegistering ? "Re-register face" : "Register face"}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
              <span className="font-medium text-ink">{employee.name}</span>
              <span className="font-mono">{employee.employeeId}</span>
              <span>· {employee.departmentName}</span>
              <EmployeeStatusBadge status={employee.status} />
            </p>
          </>
        )}
      </div>

      {dataService.kind === "sample" && <SampleDataBanner />}

      {employee?.status === "TERMINATED" ? (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title={`${employee.name} is inactive`}
            message="Inactive employees can't be registered. Reactivate them from their profile first."
            action={
              <ButtonLink href={`/app/employees/${encodeURIComponent(employee.employeeId)}`} variant="secondary" size="sm">
                Open profile
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="border-b border-line px-5 py-4">
              <Stepper current={step} />
            </div>

            <div className="space-y-5 p-5">
              {!employee ? (
                <Skeleton className="h-48" />
              ) : step === "consent" ? (
                <>
                  {heading("Confirm biometric consent")}
                  {reRegistering && (
                    <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-sm text-info">
                      <ScanFace className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {employee.name} already has a registered face. Registering again replaces it for future check-ins.
                    </p>
                  )}
                  <div className="space-y-2 text-sm text-ink-secondary">
                    <p>
                      Registering sends one photo of {employee.name} to the face recognition service, which creates a face
                      template used to recognise them when they check in or out.
                    </p>
                    <p>Before you continue, make sure {employee.name} has been told this and has agreed to it.</p>
                  </div>
                  <div className="space-y-1.5">
                    <div
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3",
                        consentError ? "border-danger bg-danger-soft/40" : "border-line-strong",
                      )}
                    >
                      <input
                        id={consentId}
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => {
                          setConsent(e.target.checked);
                          if (e.target.checked) setConsentError(false);
                        }}
                        aria-invalid={consentError || undefined}
                        aria-describedby={consentError ? consentErrorId : undefined}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                      />
                      <label htmlFor={consentId} className="text-sm text-ink">
                        {employee.name} has been informed and has given consent for their face to be registered for
                        attendance.
                        <span className="mt-1 block text-xs text-ink-muted">Confirmed by {session.name}</span>
                      </label>
                    </div>
                    {consentError && (
                      <p id={consentErrorId} className="text-xs font-medium text-danger">
                        Confirm consent to continue.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        if (!consent) {
                          setConsentError(true);
                          document.getElementById(consentId)?.focus();
                          return;
                        }
                        setStep("photo");
                      }}
                    >
                      Continue
                    </Button>
                  </div>
                </>
              ) : step === "photo" ? (
                <>
                  {heading("Take or upload a photo")}
                  <FaceCapture onCapture={acceptPhoto} />
                  <div className="flex justify-start">
                    <Button variant="ghost" onClick={() => setStep("consent")}>
                      Back
                    </Button>
                  </div>
                </>
              ) : step === "review" && image ? (
                <>
                  {heading("Check the photo and register")}
                  <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, not an optimisable asset */}
                    <img
                      src={image.dataUrl}
                      alt={`Photo of ${employee.name} to be registered`}
                      className="aspect-[4/3] w-full rounded-card bg-surface-sunken object-cover"
                    />
                    <div className="space-y-3">
                      <dl className="grid grid-cols-2 gap-3">
                        <Detail label="Source">{image.source === "camera" ? "Camera" : "Uploaded file"}</Detail>
                        <Detail label="Size">
                          <span className="tabular-nums">
                            {image.width}×{image.height} · {formatBytes(image.bytes)}
                          </span>
                        </Detail>
                      </dl>
                      <ImageWarnings warnings={image.warnings} />
                      <p className="text-sm text-ink-secondary">
                        Is the face clear, well lit and the only one in the photo? If not, retake it.
                      </p>
                    </div>
                  </div>

                  {submitting && (
                    <div role="status" className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-sm text-info">
                      <ScanFace className="mt-0.5 h-4 w-4 shrink-0 animate-pulse" aria-hidden />
                      <p>
                        Registering with the face service…
                        {elapsed >= 8 && " This can take up to 20 seconds. Keep this page open."}
                      </p>
                    </div>
                  )}

                  {failure ? (
                    <FailurePanel failure={failure}>
                      {failure.retrySamePhoto && (
                        <Button onClick={submit} loading={submitting}>
                          Try again
                        </Button>
                      )}
                      <Button variant={failure.retrySamePhoto ? "secondary" : "primary"} onClick={retake} disabled={submitting}>
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Use a different photo
                      </Button>
                    </FailurePanel>
                  ) : (
                    <div className="flex flex-wrap justify-between gap-2">
                      <Button variant="secondary" onClick={retake} disabled={submitting}>
                        <RotateCcw className="h-4 w-4" aria-hidden />
                        Retake
                      </Button>
                      <Button onClick={submit} loading={submitting}>
                        <ScanFace className="h-4 w-4" aria-hidden />
                        {reRegistering ? "Replace face" : "Register face"}
                      </Button>
                    </div>
                  )}
                </>
              ) : step === "done" && result ? (
                <>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" aria-hidden />
                    <div>
                      {heading("Face registered")}
                      <p className="mt-1 text-sm text-ink-secondary">
                        {employee.name} can now check in with face recognition.
                        {dataService.kind === "sample" && " (Sample mode: the photo was not sent anywhere.)"}
                      </p>
                    </div>
                  </div>
                  <dl className="grid gap-4 rounded-lg bg-surface-muted p-4 sm:grid-cols-2">
                    <Detail label="Registered">
                      {new Date(result.registeredAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </Detail>
                    <Detail label="Faces detected">{result.facesDetected ?? "—"}</Detail>
                    <Detail label="Face encoding ID">
                      <span className="font-mono text-xs">{result.faceEncodingId ?? "—"}</span>
                    </Detail>
                    <Detail label="Request ID">
                      <span className="font-mono text-xs">{result.requestId ?? "—"}</span>
                    </Detail>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    <ButtonLink href="/app/face-registration">Register next employee</ButtonLink>
                    <ButtonLink href={`/app/employees/${encodeURIComponent(employee.employeeId)}`} variant="secondary">
                      View profile
                    </ButtonLink>
                  </div>
                </>
              ) : null}
            </div>
          </Card>

          <div className="space-y-6">
            {step === "done" && employee && canVerify ? (
              <TestRecognition employee={employee} />
            ) : (
              <Card>
                <CardHeader title="Photo tips" />
                <div className="p-5">
                  <CaptureTips />
                </div>
              </Card>
            )}
            <Card>
              <CardHeader title="Current registration" />
              <div className="space-y-3 p-5">
                {!employee ? (
                  <Skeleton className="h-12" />
                ) : (
                  <>
                    <FaceStatusBadge registered={Boolean(employee.faceId)} />
                    {employee.faceRegisteredAt && (
                      <p className="text-sm text-ink-secondary">Registered on {formatDate(employee.faceRegisteredAt)}</p>
                    )}
                    <p className="flex items-start gap-2 text-xs text-ink-muted">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      {dataService.kind === "sample"
                        ? "Sample mode: photos stay in this browser tab and are never uploaded."
                        : "Photos go through this app's server to the face service. They are not saved in the browser."}
                    </p>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

/** Optional 1:1 check right after registration, with a fresh photo. */
function TestRecognition({ employee }: { employee: Employee }) {
  const [checking, setChecking] = useState(false);
  const [outcome, setOutcome] = useState<FaceVerificationResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useLeaveGuard(checking);

  const verify = async (img: PreparedImage) => {
    setChecking(true);
    setOutcome(null);
    setFailure(null);
    try {
      setOutcome(await dataService.verifyFace({ employeeId: employee.employeeId, imageDataUrl: img.dataUrl }));
    } catch (err) {
      setFailure(errorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Test recognition" description="Optional: check a new photo against this registration" />
      <div className="space-y-4 p-5">
        {!open ? (
          <>
            <p className="text-sm text-ink-secondary">
              Take another photo of {employee.name} to confirm they&apos;re recognised. This doesn&apos;t record attendance.
            </p>
            <Button variant="secondary" onClick={() => setOpen(true)}>
              <ScanFace className="h-4 w-4" aria-hidden />
              Test now
            </Button>
          </>
        ) : checking ? (
          <p role="status" className="flex items-center gap-2 text-sm text-info">
            <ScanFace className="h-4 w-4 animate-pulse" aria-hidden />
            Checking…
          </p>
        ) : (
          <>
            {outcome && (
              <div
                role="status"
                className={cn(
                  "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm",
                  outcome.verified ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
                )}
              >
                {outcome.verified ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                )}
                <div className="space-y-0.5">
                  <p className="font-semibold">{outcome.verified ? "Recognised" : "Not recognised"}</p>
                  <p>{outcome.message}</p>
                  {outcome.matchScore !== undefined && (
                    <p className="tabular-nums">Match score: {outcome.matchScore.toFixed(2)}</p>
                  )}
                  {outcome.recognizedEmployeeId && (
                    <p>
                      Matched employee <span className="font-mono">{outcome.recognizedEmployeeId}</span> instead.
                    </p>
                  )}
                </div>
              </div>
            )}
            {failure && (
              <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {failure}
              </p>
            )}
            <FaceCapture onCapture={verify} captureLabel="Take photo and check" />
          </>
        )}
      </div>
    </Card>
  );
}
