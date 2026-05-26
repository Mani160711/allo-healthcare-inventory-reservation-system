'use strict';
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (options: { title?: string; message: string; type?: ToastType }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({
      title,
      message,
      type = 'info',
    }: {
      title?: string;
      message: string;
      type?: ToastType;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex flex-col gap-0.5 transition-all duration-300 animate-in slide-in-from-bottom-5 duration-300 ${
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-emerald-100/50'
                : t.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-950 shadow-rose-100/50'
                : t.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-950 shadow-amber-100/50'
                : 'bg-white border-slate-200 text-slate-900 shadow-slate-100/50'
            }`}
          >
            {t.title && <span className="font-bold text-xs tracking-tight">{t.title}</span>}
            <span className="text-[10px] font-medium opacity-90 leading-normal">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
