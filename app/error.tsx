'use strict';
'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, RefreshCw, ArrowLeft, ChevronDown } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Allo Platform caught runtime exception:', error);
  }, [error]);

  const [showStack, setShowStack] = React.useState(false);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 select-none">
      <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-2xl shadow-sm flex flex-col gap-6 text-center">
        
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-rose-600" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">System Exception</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            The platform encountered a database deadlock, connection timeout, or concurrency conflict during transaction execution.
          </p>
        </div>

        
        <div className="border border-slate-200 rounded-xl overflow-hidden text-left bg-slate-50/50">
          <button
            type="button"
            onClick={() => setShowStack(!showStack)}
            className="w-full px-4 py-3 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase hover:bg-slate-100/50 transition-colors select-none"
          >
            <span>Diagnostic Details</span>
            <ChevronDown className={`w-3.5 h-3.5 transform transition-transform duration-200 ${showStack ? 'rotate-180' : ''}`} />
          </button>
          
          {showStack && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 overflow-x-auto max-h-36">
              <code className="text-[10px] text-rose-600 font-mono select-all leading-normal">
                {error.message || 'Unknown runtime concurrency exception'}
              </code>
            </div>
          )}
        </div>

        
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={() => reset()}
            className="py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5 cursor-pointer select-none"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Retry Operation</span>
          </button>
          <a
            href="/"
            className="py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 font-bold rounded-xl text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-sm select-none"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Return to Dashboard</span>
          </a>
        </div>
      </div>
    </div>
  );
}
