'use strict';
'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<any>;
  status?: 'normal' | 'warning' | 'danger' | 'success';
  trend?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
}

export default function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  status = 'normal',
  trend,
}: MetricCardProps) {
  const statusColors = {
    normal: 'border-slate-200/80 bg-white text-slate-900',
    success: 'border-emerald-200/80 bg-emerald-50/20 text-emerald-950',
    warning: 'border-amber-200/80 bg-amber-50/20 text-amber-950',
    danger: 'border-rose-200/80 bg-rose-50/20 text-rose-950',
  };

  const statusIconBg = {
    normal: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-rose-100 text-rose-600',
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md ${statusColors[status]}`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <span className="text-2xl font-bold tracking-tight select-all">
            {value}
          </span>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${statusIconBg[status]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100/60 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400 font-medium truncate">
          {description}
        </span>
        {trend && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              trend.type === 'positive'
                ? 'bg-emerald-50 text-emerald-600'
                : trend.type === 'negative'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-slate-50 text-slate-500'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
