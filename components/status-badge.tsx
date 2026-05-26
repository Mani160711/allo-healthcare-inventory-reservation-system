'use strict';
'use client';

import React from 'react';
import { Shield, ShieldAlert, ShieldAlert as DangerIcon, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  type: 'health' | 'reservation';
  status: string;
}

export default function StatusBadge({ type, status }: StatusBadgeProps) {
  const normStatus = status.toUpperCase();

  if (type === 'health') {
    switch (normStatus) {
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Optimal</span>
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Low Stock</span>
          </span>
        );
      case 'CRITICAL':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <DangerIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Depleted</span>
          </span>
        );
    }
  }

  
  switch (normStatus) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>CONFIRMED</span>
        </span>
      );
    case 'RELEASED':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          <span>RELEASED</span>
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 shrink-0 animate-shake" />
          <span>EXPIRED</span>
        </span>
      );
    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>HELD (PENDING)</span>
        </span>
      );
  }
}
