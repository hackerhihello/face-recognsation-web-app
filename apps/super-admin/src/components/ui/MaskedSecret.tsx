"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { CopyButton } from "./CopyButton";

interface MaskedSecretProps {
  maskedText: string;
  rawText?: string;
}

export function MaskedSecret({ maskedText, rawText }: MaskedSecretProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-xs">
      <span className="rounded bg-slate-100 dark:bg-slate-900 px-2 py-1 border border-slate-200 dark:border-slate-800 text-cyan-800 dark:text-cyan-300">
        {revealed && rawText ? rawText : maskedText}
      </span>
      {rawText && (
        <button
          onClick={() => setRevealed(!revealed)}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          title={revealed ? "Hide secret" : "Reveal secret"}
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      )}
      <CopyButton text={revealed && rawText ? rawText : maskedText} />
    </div>
  );
}
