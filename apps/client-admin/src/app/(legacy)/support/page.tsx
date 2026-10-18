'use client';

import React from 'react';
import { useClientPortal } from '@/lib/clientPortalStore';
import { BookOpen, ExternalLink, LifeBuoy, Mail, ShieldCheck, Terminal } from 'lucide-react';

export default function SupportPage() {
  const { settings } = useClientPortal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Help Center & Technical Support</h1>
          <p className="text-sm text-slate-500 mt-1">
            Documentation, hardware terminal configuration guides, and enterprise support contacts for <span className="font-semibold text-slate-800">{settings.companyName}</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Guides */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Edge Device Setup Guide</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Step-by-step instructions for enrolling Android/iOS tablet kiosks, configuring CCTV RTSP streams, and calibrating infrared illumination for 99.8% biometric precision.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <a
              href="https://faceapidocs.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Open Documentation <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* API Specification */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">API Documentation</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Explore Railway Face Recognition API endpoints: <code>/v1/face/register</code>, <code>/v1/face/verify</code>, authentication headers, error codes, and Cloudflare R2 vector storage.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <a
              href="https://faceapidocs.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              API Reference <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* SLA Support */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Enterprise SLA Helpdesk</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Direct access to dedicated DevOps engineers for attendance gateway errors, token rate limits, and custom geofence perimeter calibrations.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500">24/7 SLA Priority</span>
            <a
              href="mailto:support@buragitech.com"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700"
            >
              Contact Support <Mail className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Biometric Privacy & Compliance Statement</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              This application complies with ISO/IEC 30107-3 biometric presentation attack detection standards and regional data protection regulations. Raw facial photos are converted to 512-dimensional mathematical embeddings and securely stored in Cloudflare R2. Photos are never sold, shared with third parties, or retained without explicit employee consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
