"use client";

import React, { useEffect, useRef, useState } from "react";

interface DiagramProps {
  chartDefinition?: string;
  title?: string;
}

const DEFAULT_TOPOLOGY = `flowchart TD
  subgraph Edge["Client & Edge Tier"]
    Mobile["Mobile Device (iOS/Android)"]
    WebPortal["Admin & Super Admin Web"]
    Gateway["Cloudflare Anycast Gateway & WAF"]
  end

  subgraph AuthTier["Zero-Trust Security & Tracing"]
    TokenValidator["Token Quota & SHA-256 Validator"]
    TraceRouter["Request ID Injector (REQ-YYYYMMDD-XXXXXX)"]
    Idempotency["Redis Idempotency Store (24h)"]
  end

  subgraph InferenceTier["Face Recognition Core (Railway)"]
    AntiSpoof["Liveness & 3D Texture Check"]
    InsightFace["InsightFace ArcFace (512-d Vectorizer)"]
    CosineMatcher["Cosine Matcher (Threshold >= 0.850)"]
  end

  subgraph StorageTier["Data & Biometric Vault"]
    R2["Cloudflare R2 (Encrypted Biometrics)"]
    Convex["Convex Reactive Store (13 Collections)"]
  end

  Mobile --> Gateway
  WebPortal --> Gateway
  Gateway --> TokenValidator
  TokenValidator --> TraceRouter
  TraceRouter --> Idempotency
  Idempotency --> AntiSpoof
  AntiSpoof --> InsightFace
  InsightFace --> CosineMatcher
  CosineMatcher --> R2
  CosineMatcher --> Convex
`;

export function SystemTopologyDiagram({ chartDefinition = DEFAULT_TOPOLOGY, title }: DiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderedSvg, setRenderedSvg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderMermaid() {
      try {
        setLoading(true);
        setError(null);
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          fontFamily: "monospace",
          flowchart: {
            curve: "basis",
            useMaxWidth: true,
          },
        });

        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chartDefinition);
        if (isMounted) {
          setRenderedSvg(svg);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to render Mermaid chart");
          setLoading(false);
        }
      }
    }

    renderMermaid();

    return () => {
      isMounted = false;
    };
  }, [chartDefinition]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d18] p-5 sm:p-6 shadow-sm">
      {title && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 font-semibold">
            Mermaid.js Flow
          </span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-12 text-xs text-slate-500 font-mono gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <span>Rendering Architecture Topology...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-mono text-amber-300">
          <p className="font-bold mb-1">Architecture Diagram Source:</p>
          <pre className="text-[11px] overflow-x-auto whitespace-pre">{chartDefinition}</pre>
        </div>
      )}

      {!loading && !error && (
        <div
          ref={containerRef}
          className="overflow-x-auto flex justify-center py-2 [&>svg]:max-w-full [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: renderedSvg }}
        />
      )}
    </div>
  );
}
