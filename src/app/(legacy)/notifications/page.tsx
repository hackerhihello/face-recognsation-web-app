'use client';

import React from 'react';
import { useClientPortal } from '@/lib/clientPortalStore';
import { Bell, AlertTriangle, CheckCircle, Info, Clock, Check } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markNotificationRead } = useClientPortal();

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Alerts & Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time automated alerts for geofence breaches, anomalous face verification failures, and shift compliance events.
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No notifications available.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.notificationId}
              className={`p-5 flex items-start gap-4 transition-colors ${
                !n.isRead ? 'bg-slate-50/70' : 'hover:bg-slate-50/30'
              }`}
            >
              <div className="shrink-0 mt-0.5">{getIcon(n.severity)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                    {n.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!n.isRead && (
                      <button
                        onClick={() => markNotificationRead(n.notificationId)}
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded"
                      >
                        <Check className="w-3 h-3" />
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                <div className="mt-2 text-xs font-mono text-slate-400 bg-slate-100/80 px-2.5 py-1 rounded inline-block">
                  Category: {n.category} · Priority: {n.severity}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
