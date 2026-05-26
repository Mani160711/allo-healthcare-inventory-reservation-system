'use strict';
'use client';

import React from 'react';
import { X, Warehouse as WarehouseIcon, HelpCircle, Lock, Calendar, Loader } from 'lucide-react';

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

interface ReserveModalProps {
  product: Product;
  selectedWarehouseId: string;
  setSelectedWarehouseId: (id: string) => void;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>> | ((q: number | ((prev: number) => number)) => void);
  idempotencyKey: string;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function ReserveModal({
  product,
  selectedWarehouseId,
  setSelectedWarehouseId,
  quantity,
  setQuantity,
  idempotencyKey,
  isPending,
  onSubmit,
  onClose,
}: ReserveModalProps) {
  
  const activeInventory = product.inventories.find(
    (inv) => inv.warehouse.id === selectedWarehouseId
  );
  const maxAvailable = activeInventory ? activeInventory.availableStock : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        
        
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
              Secure Allocation Lock
            </span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <WarehouseIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Select Storage Facility</span>
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => {
                setSelectedWarehouseId(e.target.value);
                setQuantity(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer transition-all"
            >
              {product.inventories.map((inv) => (
                <option key={inv.id} value={inv.warehouse.id}>
                  {inv.warehouse.name} ({inv.availableStock} available)
                </option>
              ))}
            </select>
          </div>

          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Quantity to Allocate</span>
              </label>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
                Limit: {maxAvailable} units
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={quantity <= 1 || isPending}
                onClick={() => setQuantity((q: number) => q - 1)}
                className="w-12 h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-lg select-none"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={maxAvailable || 1}
                value={quantity}
                disabled={isPending}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.min(Math.max(1, val), maxAvailable || 1));
                }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl h-12 text-center font-mono text-base font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                disabled={quantity >= maxAvailable || isPending}
                onClick={() => setQuantity((q: number) => q + 1)}
                className="w-12 h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-lg select-none"
              >
                +
              </button>
            </div>
          </div>

          
          <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-3.5 flex items-start gap-2.5">
            <Calendar className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide leading-none">
                10-Minute Clinical Reservation Hold
              </span>
              <span className="text-[9px] text-slate-500 mt-1 leading-normal">
                Units will be temporarily locked. If checkout payment is not settled within 10 minutes, units are automatically released back to storage.
              </span>
            </div>
          </div>

          
          {idempotencyKey && (
            <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-2.5 flex justify-between items-center text-[9px] select-all">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Idempotency Key:</span>
              <span className="font-mono text-slate-500 truncate max-w-[200px]" title={idempotencyKey}>
                {idempotencyKey}
              </span>
            </div>
          )}

          
          <div className="flex flex-col gap-2 mt-4 border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={maxAvailable <= 0 || isPending}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin text-white" />
                  <span>Acquiring Serializable Lock...</span>
                </>
              ) : (
                <span>Confirm Clinical Hold</span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer select-none"
            >
              Cancel Hold Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
