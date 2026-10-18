"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Camera, ImageUp, Upload } from "lucide-react";
import { Button } from "@/components/ds/Button";
import { cn } from "@/lib/cn";
import { ACCEPTED_IMAGE_TYPES, ImageCheckError, MIN_IMAGE_SIDE, imageFromFile, imageFromVideo, type PreparedImage } from "@/lib/image";

type Mode = "camera" | "upload";
type CameraState = "idle" | "starting" | "live" | "error";

function cameraErrorMessage(err: unknown) {
  const name = err instanceof DOMException ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access was blocked. Allow the camera in your browser's site settings, or upload a photo instead.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device. Upload a photo instead.";
    case "NotReadableError":
      return "The camera is being used by another app. Close it and try again.";
    default:
      return "The camera couldn't be started. Try again or upload a photo instead.";
  }
}

export function CaptureTips() {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-ink-secondary">
      <li>Only one person in the frame, looking straight at the camera.</li>
      <li>Even light on the face, with no strong light behind them.</li>
      <li>No sunglasses, mask or hat covering the face.</li>
      <li>Fill the oval with the face. Neutral expression.</li>
    </ul>
  );
}

/** Takes a face photo from the camera or a file and hands back a checked, resized JPEG. */
export function FaceCapture({ onCapture, captureLabel = "Take photo" }: { onCapture: (image: PreparedImage) => void; captureLabel?: string }) {
  const [mode, setMode] = useState<Mode>("camera");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputId = useId();
  const errorId = useId();

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // Always release the camera when leaving the screen.
  useEffect(() => stopCamera, []);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    stopCamera();
    setCameraState("idle");
    setError(null);
    setMode(next);
  };

  const startCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("error");
      setError(
        window.isSecureContext
          ? "This browser can't use the camera. Upload a photo instead."
          : "The camera only works over a secure (https) connection. Upload a photo instead.",
      );
      return;
    }
    setCameraState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopCamera();
        return;
      }
      video.srcObject = stream;
      await video.play();
      setCameraState("live");
    } catch (err) {
      stopCamera();
      setCameraState("error");
      setError(cameraErrorMessage(err));
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    try {
      const image = imageFromVideo(video);
      stopCamera();
      setCameraState("idle");
      onCapture(image);
    } catch (err) {
      setError(err instanceof ImageCheckError ? err.message : "The photo couldn't be captured. Try again.");
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      onCapture(await imageFromFile(file));
    } catch (err) {
      setError(err instanceof ImageCheckError ? err.message : "This photo couldn't be used. Try another one.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Photo source" className="inline-flex rounded-lg border border-line-strong bg-surface-sunken p-0.5">
        {(
          [
            { id: "camera", label: "Camera", icon: Camera },
            { id: "upload", label: "Upload photo", icon: ImageUp },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            onClick={() => switchMode(id)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
              mode === id ? "bg-surface text-ink shadow-sm" : "text-ink-secondary hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {mode === "camera" ? (
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card bg-nav">
            {/* Mirrored like a mirror for framing; the captured photo is not mirrored. */}
            <video
              ref={videoRef}
              playsInline
              muted
              aria-label="Camera preview"
              className={cn("h-full w-full -scale-x-100 object-cover", cameraState !== "live" && "invisible")}
            />
            {cameraState === "live" && (
              <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="aspect-[3/4] h-[78%] rounded-[50%] border-2 border-white/85 shadow-[0_0_0_9999px_rgb(11_27_51/0.45)]" />
              </div>
            )}
            {cameraState !== "live" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                {cameraState === "error" ? (
                  <AlertCircle className="h-8 w-8 text-white/80" aria-hidden />
                ) : (
                  <Camera className="h-8 w-8 text-white/80" aria-hidden />
                )}
                <p className="max-w-xs text-sm text-nav-ink">
                  {cameraState === "error"
                    ? "The camera isn't available."
                    : "Your browser will ask for permission to use the camera. Nothing is recorded until you take the photo."}
                </p>
                <Button variant="secondary" size="sm" onClick={startCamera} loading={cameraState === "starting"}>
                  {cameraState === "error" ? "Try again" : "Start camera"}
                </Button>
              </div>
            )}
          </div>
          {cameraState === "live" && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={capture}>
                <Camera className="h-4 w-4" aria-hidden />
                {captureLabel}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  stopCamera();
                  setCameraState("idle");
                }}
              >
                Stop camera
              </Button>
            </div>
          )}
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void handleFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed p-6 text-center transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
            dragOver ? "border-primary bg-primary-soft" : "border-line-strong bg-surface-muted hover:bg-surface-sunken",
          )}
        >
          <Upload className="h-8 w-8 text-ink-muted" aria-hidden />
          <span className="text-sm font-medium text-ink">{processing ? "Checking photo…" : "Choose a photo or drag it here"}</span>
          <span className="text-xs text-ink-muted">
            JPEG, PNG or WebP, up to 10 MB, at least {MIN_IMAGE_SIDE} px on the shorter side
          </span>
          <input
            id={inputId}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="sr-only"
            disabled={processing}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              // Allow choosing the same file again after an error.
              e.target.value = "";
            }}
          />
        </label>
      )}

      {error && (
        <div id={errorId} role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="space-y-1.5">
            <p>{error}</p>
            {mode === "camera" && cameraState === "error" && (
              <button type="button" onClick={() => switchMode("upload")} className="font-medium underline underline-offset-2">
                Upload a photo instead
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
