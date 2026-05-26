import React from 'react';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 select-none">
      <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-2xl shadow-sm flex flex-col gap-6 text-center">
        
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-blue-600" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Record Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            The requested inventory holding, allocation parameter, or logistics page could not be located on this server. It may have expired and been cleaned.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <a
            href="/"
            className="py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all text-center cursor-pointer shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Return to Clinical Hub</span>
          </a>
        </div>
      </div>
    </div>
  );
}
