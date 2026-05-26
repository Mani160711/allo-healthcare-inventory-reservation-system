'use strict';
'use client';

import React from 'react';
import { Package, MapPin, Layers, Lock, ShieldCheck } from 'lucide-react';
import StatusBadge from './status-badge';

interface Warehouse {
  id: string;
  name: string;
}

interface Inventory {
  id: string;
  warehouse: Warehouse;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
}

interface Product {
  id: string;
  name: string;
  inventories: Inventory[];
}

interface InventoryCardProps {
  product: Product;
  onReserve: (product: Product) => void;
}

export default function InventoryCard({ product, onReserve }: InventoryCardProps) {
  const grandTotalAvailable = product.inventories.reduce(
    (acc, inv) => acc + inv.availableStock,
    0
  );

  const grandTotalReserved = product.inventories.reduce(
    (acc, inv) => acc + inv.reservedStock,
    0
  );

  
  
  
  
  let healthStatus: 'HEALTHY' | 'LOW' | 'CRITICAL' = 'HEALTHY';
  if (grandTotalAvailable === 0) {
    healthStatus = 'CRITICAL';
  } else if (grandTotalAvailable < 15) {
    healthStatus = 'LOW';
  }

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex flex-col gap-4">
        
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-500 group-hover:text-blue-600 transition-colors">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-800 tracking-tight leading-snug truncate" title={product.name}>
              {product.name}
            </h3>
          </div>
          <StatusBadge type="health" status={healthStatus} />
        </div>

        
        <div className="mt-2 flex flex-col gap-2.5">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <Layers className="w-3.5 h-3.5" />
            <span>Warehouse Stock Levels</span>
          </div>

          <div className="divide-y divide-slate-100/80 flex flex-col bg-slate-50/50 rounded-xl border border-slate-200/40 p-3.5">
            {product.inventories.map((inv) => (
              <div
                key={inv.id}
                className="flex justify-between items-center py-2 text-xs first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-600 font-semibold truncate" title={inv.warehouse.name}>
                    {inv.warehouse.name}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {inv.reservedStock > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5 text-amber-500" />
                      <span>{inv.reservedStock} held</span>
                    </span>
                  )}
                  <span className="font-mono text-slate-600">
                    <strong className="text-slate-900 font-bold">
                      {inv.availableStock}
                    </strong>
                    <span className="text-slate-400 font-normal">/{inv.totalStock}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      
      <button
        disabled={grandTotalAvailable <= 0}
        onClick={() => onReserve(product)}
        className={`mt-6 w-full py-3 px-4 rounded-xl text-xs font-semibold tracking-tight transition-all text-center flex items-center justify-center gap-2 shadow-sm cursor-pointer border ${
          grandTotalAvailable > 0
            ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 shadow-blue-600/10 focus:ring-2 focus:ring-blue-400 focus:outline-none'
            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none'
        }`}
      >
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>Reserve Clinical Units</span>
      </button>
    </div>
  );
}
