'use strict';
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ArrowRight, ShieldCheck, Clipboard } from 'lucide-react';
import StatusBadge from './status-badge';

interface Reservation {
  id: string;
  productName: string;
  warehouseName: string;
  quantity: number;
  status: string;
}

interface InventoryTableProps {
  reservations: Reservation[];
  isLoading: boolean;
}

export default function InventoryTable({ reservations, isLoading }: InventoryTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-100 border border-slate-200 rounded-xl w-full" />
        ))}
      </div>
    );
  }

  if (!reservations || reservations.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center gap-3">
        <Clipboard className="w-8 h-8 text-slate-300" />
        <span className="text-xs font-semibold">No operational reservations or holdings logged yet.</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 select-none">
            <th className="px-6 py-4">Holding Reference ID</th>
            <th className="px-6 py-4">Allocated Item</th>
            <th className="px-6 py-4">Storage Warehouse</th>
            <th className="px-6 py-4 text-center">Batch Quantity</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {reservations.map((res) => (
            <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
              
              <td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-500 select-all tracking-tight max-w-[120px] truncate" title={res.id}>
                {res.id}
              </td>
              
              <td className="px-6 py-4 font-bold text-slate-800 truncate max-w-[180px]" title={res.productName}>
                {res.productName}
              </td>
              
              <td className="px-6 py-4 text-slate-500 font-semibold truncate max-w-[150px]" title={res.warehouseName}>
                {res.warehouseName}
              </td>
              
              <td className="px-6 py-4 text-center font-mono font-bold text-slate-700">
                {res.quantity} unit{res.quantity > 1 ? 's' : ''}
              </td>
              
              <td className="px-6 py-4 text-center">
                <StatusBadge type="reservation" status={res.status} />
              </td>
              
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => router.push(`/reservation/${res.id}`)}
                  className="py-1.5 px-3.5 bg-slate-50 hover:bg-slate-100 hover:text-blue-700 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold tracking-tight transition-all cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                >
                  {res.status === 'PENDING' ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                      <span>Track holding</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>View details</span>
                    </>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
