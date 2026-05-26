'use strict';
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/providers/toast-provider';
import {
  Activity,
  ShieldAlert,
  Warehouse as WarehouseIcon,
  FolderLock
} from 'lucide-react';


import MetricCard from '@/components/metric-card';
import InventoryCard from '@/components/inventory-card';
import InventoryTable from '@/components/inventory-table';
import ReserveModal from '@/components/reserve-modal';

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

function DashboardContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const currentView = searchParams.get('view') || 'dashboard';

  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [modalIdempotencyKey, setModalIdempotencyKey] = useState<string>('');

  
  const {
    data: products,
    isLoading,
    isError,
    refetch,
  } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      return res.json();
    },
  });

  
  const { data: reservations, isLoading: isReservationsLoading } = useQuery<any[]>({
    queryKey: ['reservations'],
    queryFn: async () => {
      const res = await fetch('/api/reservations');
      if (!res.ok) {
        throw new Error('Failed to fetch transaction logs');
      }
      return res.json();
    },
    refetchInterval: 5000, 
  });

  
  useEffect(() => {
    if (selectedProduct) {
      const key = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setModalIdempotencyKey(key);

      
      const availableInv = selectedProduct.inventories.find((inv) => inv.availableStock > 0);
      setSelectedWarehouseId(availableInv ? availableInv.warehouse.id : selectedProduct.inventories[0]?.warehouse.id || '');
      setQuantity(1);
    } else {
      setModalIdempotencyKey('');
      setSelectedWarehouseId('');
      setQuantity(1);
    }
  }, [selectedProduct]);

  
  const activeInventory = selectedProduct?.inventories.find(
    (inv) => inv.warehouse.id === selectedWarehouseId
  );
  const maxAvailable = activeInventory ? activeInventory.availableStock : 0;

  
  const reserveMutation = useMutation({
    mutationFn: async (payload: {
      productId: string;
      warehouseId: string;
      quantity: number;
      idempotencyKey: string;
    }) => {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': payload.idempotencyKey,
        },
        body: JSON.stringify({
          productId: payload.productId,
          warehouseId: payload.warehouseId,
          quantity: payload.quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors[0].message);
        }
        throw new Error(data.error || 'Failed to create reservation');
      }
      return data; 
    },
    onSuccess: (data) => {
      toast({
        title: 'Allocation Success',
        message: 'Clinical stock has been temporarily reserved.',
        type: 'success',
      });
      
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      
      router.refresh();
      
      setSelectedProduct(null);
      
      router.push(`/reservation/${data.reservationId}`);
    },
    onError: (err: Error) => {
      toast({
        title: 'Allocation Denied',
        message: err.message,
        type: 'error',
      });
    },
  });

  const handleReserveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedWarehouseId || quantity <= 0) return;

    if (quantity > maxAvailable) {
      toast({
        title: 'Invalid Quantity',
        message: `You cannot reserve more than ${maxAvailable} available units.`,
        type: 'warning',
      });
      return;
    }

    reserveMutation.mutate({
      productId: selectedProduct.id,
      warehouseId: selectedWarehouseId,
      quantity,
      idempotencyKey: modalIdempotencyKey,
    });
  };

  
  const activeHoldsCount = reservations?.filter(res => res.status === 'PENDING').length || 0;
  
  const safetyAlertsCount = products?.filter(prod => {
    const totalAvail = prod.inventories.reduce((acc, inv) => acc + inv.availableStock, 0);
    return totalAvail < 15; 
  }).length || 0;

  const activeWarehousesSet = new Set<string>();
  products?.forEach(p => p.inventories.forEach(i => activeWarehousesSet.add(i.warehouse.id)));
  const warehousesCount = activeWarehousesSet.size;

  
  const warehousesMap: {
    [id: string]: {
      id: string;
      name: string;
      totalStock: number;
      reservedStock: number;
      availableStock: number;
      productsCount: number;
    }
  } = {};

  products?.forEach((product) => {
    product.inventories.forEach((inv) => {
      const wId = inv.warehouse.id;
      if (!warehousesMap[wId]) {
        warehousesMap[wId] = {
          id: wId,
          name: inv.warehouse.name,
          totalStock: 0,
          reservedStock: 0,
          availableStock: 0,
          productsCount: 0,
        };
      }
      const w = warehousesMap[wId];
      w.totalStock += inv.totalStock;
      w.reservedStock += inv.reservedStock;
      w.availableStock += inv.availableStock;
      w.productsCount += 1;
    });
  });
  const warehousesList = Object.values(warehousesMap);

  return (
    <div id="top" className="flex flex-col gap-8 max-w-6xl mx-auto scroll-mt-24">
      
      <div className="flex justify-between items-center border-b border-slate-200/80 pb-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 shrink-0" />
            <span>
              {currentView === 'dashboard' && 'Clinical Inventory Logistics Control'}
              {currentView === 'inventory' && 'Shelf Inventory Products'}
              {currentView === 'reservations' && 'Clinical Holds & Transaction Records'}
              {currentView === 'warehouses' && 'Operational Storage Warehouses'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {currentView === 'dashboard' && 'Real-time batch tracking and temporary allocation locks across secure medical storage facilities.'}
            {currentView === 'inventory' && 'List of all integrated medical products and clinical storage levels.'}
            {currentView === 'reservations' && 'Active holds and finalized purchase records log.'}
            {currentView === 'warehouses' && 'Warehouse locations and aggregate medical inventory capacity filters.'}
          </p>
        </div>
      </div>

      
      {currentView === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Active Allocations"
            value={isLoading ? '...' : activeHoldsCount}
            description="Active 10-min patient checkout reservations"
            icon={FolderLock}
            status={activeHoldsCount > 0 ? 'warning' : 'normal'}
            trend={!isLoading ? { value: `${activeHoldsCount} active`, type: activeHoldsCount > 0 ? 'positive' : 'neutral' } : undefined}
          />
          <MetricCard
            title="Safety Threshold Alarms"
            value={isLoading ? '...' : safetyAlertsCount}
            description="Items below critical limits (<15 units)"
            icon={ShieldAlert}
            status={safetyAlertsCount > 0 ? 'danger' : 'success'}
            trend={!isLoading ? { value: safetyAlertsCount > 0 ? 'Action Needed' : 'Nominal', type: safetyAlertsCount > 0 ? 'negative' : 'positive' } : undefined}
          />
          <MetricCard
            title="Storage Facilities"
            value={isLoading ? '...' : warehousesCount}
            description="Active integrated logistics warehouses"
            icon={WarehouseIcon}
            status="normal"
          />
        </div>
      )}

      
      {(currentView === 'dashboard' || currentView === 'inventory') && (
        <div id="inventory-section" className="flex flex-col gap-4 mt-2 scroll-mt-24">
          {currentView === 'dashboard' && (
            <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">
              Batch Items Status
            </h3>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 h-72 animate-pulse flex flex-col justify-between">
                  <div className="flex flex-col gap-4">
                    <div className="h-6 w-2/3 bg-slate-200 rounded-md" />
                    <div className="space-y-2 mt-4">
                      <div className="h-4 w-full bg-slate-100 rounded" />
                      <div className="h-4 w-5/6 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-10 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 border border-rose-200 bg-rose-50/50 rounded-2xl text-center flex flex-col items-center gap-3.5 max-w-md mx-auto">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
              <span className="text-sm font-bold text-rose-800">Database Connection Interrupt</span>
              <p className="text-xs text-slate-500 leading-normal">
                Could not pull fresh inventories. Ensure PostgreSQL instance is reachable and migrations are applied.
              </p>
              <button
                onClick={() => refetch()}
                className="py-2 px-4 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Retry Secure Connection
              </button>
            </div>
          ) : products?.length === 0 ? (
            <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white max-w-md mx-auto w-full font-semibold text-xs">
              No clinical items registered. Run seed script commands to initialize the database shelf.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products?.map((product) => (
                <InventoryCard
                  key={product.id}
                  product={product}
                  onReserve={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </div>
      )}

      
      {(currentView === 'dashboard' || currentView === 'reservations') && (
        <div id="reservations-section" className="flex flex-col gap-4 mt-6 border-t border-slate-200/80 pt-8 scroll-mt-24 first:border-0 first:mt-0 first:pt-0">
          {currentView === 'dashboard' && (
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">
                Operational Allocations Audit Log
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Monitor real-time patient hold locks and checkout logs. Select any PENDING allocation to track the checkout expiration timer.
              </p>
            </div>
          )}

          <InventoryTable
            reservations={reservations || []}
            isLoading={isReservationsLoading}
          />
        </div>
      )}

      
      {currentView === 'warehouses' && (
        <div className="flex flex-col gap-4 mt-2">
          <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">
            Operational Warehouses Summary
          </h3>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 h-60" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {warehousesList.map((wh) => (
                <div key={wh.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                          <WarehouseIcon className="w-4.5 h-4.5" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 leading-snug truncate max-w-[160px]" title={wh.name}>
                          {wh.name}
                        </h4>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span>Active</span>
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100/80 flex flex-col bg-slate-50/50 rounded-xl border border-slate-200/40 p-3.5 text-xs text-slate-600 gap-1.5">
                      <div className="flex justify-between items-center py-1">
                        <span className="font-semibold">Clinical Items Stored</span>
                        <span className="font-mono font-bold text-slate-850">{wh.productsCount} Categories</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="font-semibold">Available Units</span>
                        <span className="font-mono font-bold text-slate-850">{wh.availableStock} units</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="font-semibold">Pending Locks</span>
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded">{wh.reservedStock} held</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="font-semibold">Total Stock Capacity</span>
                        <span className="font-mono font-bold text-slate-450">{wh.totalStock} units</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      
      {selectedProduct && (
        <ReserveModal
          product={selectedProduct}
          selectedWarehouseId={selectedWarehouseId}
          setSelectedWarehouseId={setSelectedWarehouseId}
          quantity={quantity}
          setQuantity={setQuantity}
          idempotencyKey={modalIdempotencyKey}
          isPending={reserveMutation.isPending}
          onSubmit={handleReserveSubmit}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 rounded-2xl max-w-6xl mx-auto" />}>
      <DashboardContent />
    </Suspense>
  );
}
