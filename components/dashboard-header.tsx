'use strict';
'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  Activity,
  HeartPulse
} from 'lucide-react';
import { useToast } from '@/components/providers/toast-provider';

export default function DashboardHeader() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['reservations'] });
      router.refresh();
      
      toast({
        title: 'System Synced',
        message: 'Synchronized live stocks from Neon PostgreSQL database.',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        message: 'Could not connect to database services.',
        type: 'error',
      });
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between z-20 shrink-0 select-none shadow-sm shadow-slate-100">
      
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4 text-blue-600 shrink-0" />
          <h1 className="font-bold text-base text-slate-900 tracking-tight leading-none">
            Allo Healthcare
          </h1>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Inventory Reservation Platform
        </span>
      </div>

      
      <div className="flex items-center gap-4">
        
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 py-2 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer disabled:opacity-50 select-none"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
          <span>Sync Stock</span>
        </button>


      </div>
    </header>
  );
}
