'use strict';
'use client';

import React from 'react';
import { Timer, AlertTriangle, AlertCircle } from 'lucide-react';

interface CountdownProps {
  secondsLeft: number;
  status: string;
}

export default function Countdown({ secondsLeft, status }: CountdownProps) {
  
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const isExpired = secondsLeft <= 0 || status === 'EXPIRED';
  const isWarning = secondsLeft > 0 && secondsLeft < 180; 

  
  let timerColorClass = 'text-blue-600';
  let bannerBgClass = 'bg-blue-50/50 border-blue-100';
  let badgeColorClass = 'bg-blue-100 text-blue-800';
  let Icon = Timer;

  if (isExpired) {
    timerColorClass = 'text-rose-600 animate-pulse';
    bannerBgClass = 'bg-rose-50/50 border-rose-100';
    badgeColorClass = 'bg-rose-100 text-rose-800';
    Icon = AlertCircle;
  } else if (isWarning) {
    timerColorClass = 'text-amber-600';
    bannerBgClass = 'bg-amber-50/50 border-amber-100';
    badgeColorClass = 'bg-amber-100 text-amber-800';
    Icon = AlertTriangle;
  }

  
  const percentLeft = Math.min(100, Math.max(0, (secondsLeft / 600) * 100));

  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 ${bannerBgClass}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 shrink-0 ${timerColorClass}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isExpired ? 'Holding Period Expired' : 'Active Holding Countdown'}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeColorClass}`}>
          {isExpired ? 'EXPIRED' : isWarning ? 'LOW TIME WARNING' : 'SAFE HOLD'}
        </span>
      </div>

      
      <div className="text-center py-4 select-none">
        <span className={`font-mono text-5xl font-extrabold tracking-tight select-all leading-none ${timerColorClass}`}>
          {isExpired ? '00:00' : formatTime(secondsLeft)}
        </span>
      </div>

      
      {!isExpired && (
        <div className="flex flex-col gap-2">
          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden shadow-inner">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ease-linear shadow-sm ${
                isWarning ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${percentLeft}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-400 font-medium leading-normal">
            Inventory is locked strictly for checkout allocation. Once this timer lapses, the units are immediately returned to warehouse active stock.
          </span>
        </div>
      )}
    </div>
  );
}
