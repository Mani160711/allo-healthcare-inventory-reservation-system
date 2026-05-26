'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/toast-provider';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Loader,
  Layers,
  MapPin,
  Calendar,
  XCircle
} from 'lucide-react';

import Countdown from './countdown';
import StatusBadge from './status-badge';

interface ReservationDetails {
  id: string;
  inventoryId: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

export default function ReservationDetailClient({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  
  const {
    data: reservation,
    isLoading,
    isError,
    refetch,
  } = useQuery<ReservationDetails>({
    queryKey: ['reservation', id],
    queryFn: async () => {
      const res = await fetch(`/api/reservations/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch reservation details');
      }
      return res.json();
    },
    
    refetchInterval: (query) => {
      return query.state.data?.status === 'PENDING' ? 5000 : false;
    },
  });

  
  useEffect(() => {
    if (!reservation || reservation.status !== 'PENDING') {
      setSecondsLeft(0);
      return;
    }

    const calculateSeconds = () => {
      const expiry = new Date(reservation.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      return diff;
    };

    
    const initialSeconds = calculateSeconds();
    setSecondsLeft(initialSeconds);

    if (initialSeconds <= 0) {
      refetch(); 
      return;
    }

    const timer = setInterval(() => {
      const currentDiff = calculateSeconds();
      setSecondsLeft(currentDiff);

      if (currentDiff <= 0) {
        clearInterval(timer);
        refetch(); 
        toast({
          title: 'Holding Lock Expired',
          message: 'Clinical reservation hold has expired and units have been returned to warehouse stock.',
          type: 'warning',
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [reservation, refetch, toast]);

  
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reservations/${id}/confirm`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm purchase');
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Checkout Finalized',
        message: 'Units successfully allocated and checkout recorded.',
        type: 'success',
      });
      
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.refresh();
    },
    onError: (err: Error) => {
      
      toast({
        title: 'Transaction Declined',
        message: err.message,
        type: 'error',
      });
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.refresh();
    },
  });

  
  const releaseMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reservations/${id}/release`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to release reservation');
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Holding Released',
        message: 'Clinical units returned back to storage shelf.',
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.refresh();
    },
    onError: (err: Error) => {
      toast({
        title: 'Release Failed',
        message: err.message,
        type: 'error',
      });
    },
  });

  const isPending = reservation?.status === 'PENDING';
  const isButtonsDisabled =
    !isPending || confirmMutation.isPending || releaseMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 select-none">
      
      <div>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors group cursor-pointer border border-slate-200 px-3 py-1.5 rounded-xl bg-white shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
          <span>Return to Clinical Hub</span>
        </a>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 h-96 flex flex-col gap-6 animate-pulse justify-center">
          <div className="h-6 w-1/3 bg-slate-200 rounded-md mx-auto" />
          <div className="h-10 w-2/3 bg-slate-200 rounded-md mx-auto" />
          <div className="h-24 w-full bg-slate-100 rounded-xl" />
        </div>
      ) : isError || !reservation ? (
        <div className="p-8 border border-rose-200 bg-rose-50/50 rounded-2xl text-center flex flex-col items-center gap-4 max-w-md mx-auto shadow-sm">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
          <span className="text-sm font-bold text-rose-800">Allocation Not Found</span>
          <p className="text-xs text-slate-500 leading-normal">
            This reservation ID does not exist or has been permanently pruned from our active tables.
          </p>
          <a
            href="/"
            className="py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-sm"
          >
            Back to Dashboard
          </a>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden">
          
          
          <div className="flex flex-col gap-1.5 items-center text-center border-b border-slate-100 pb-5">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono select-all">
              Reference: {reservation.id}
            </span>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-800 mt-1">
              Active Stock Holding Order
            </h2>
            <div className="mt-2.5">
              <StatusBadge type="reservation" status={reservation.status} />
            </div>
          </div>

          
          <div className="flex items-center justify-between my-2 px-2 select-none relative">
            
            <div className="flex flex-col items-center gap-1.5 flex-1 relative z-10">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-200 shadow-sm shrink-0">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[9px] font-bold text-slate-800 tracking-tight">Lock Placed</span>
            </div>

            
            <div className="flex flex-col items-center gap-1.5 flex-1 relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border shadow-sm shrink-0 ${
                reservation.status === 'PENDING'
                  ? 'bg-amber-50 text-amber-600 border-amber-300 animate-pulse'
                  : reservation.status === 'CONFIRMED'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}>
                <Lock className={`w-3.5 h-3.5 ${reservation.status === 'PENDING' ? 'text-amber-500' : reservation.status === 'CONFIRMED' ? 'text-blue-500' : 'text-slate-450'}`} />
              </div>
              <span className={`text-[9px] font-bold tracking-tight ${reservation.status === 'PENDING' ? 'text-amber-600' : 'text-slate-500'}`}>
                Units Held
              </span>
            </div>

            
            <div className="flex flex-col items-center gap-1.5 flex-1 relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border shadow-sm shrink-0 ${
                reservation.status === 'CONFIRMED'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300 animate-bounce'
                  : reservation.status === 'RELEASED' || reservation.status === 'EXPIRED'
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}>
                {reservation.status === 'CONFIRMED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : reservation.status === 'RELEASED' || reservation.status === 'EXPIRED' ? (
                  <XCircle className="w-4 h-4 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <span className={`text-[9px] font-bold tracking-tight ${
                reservation.status === 'CONFIRMED' ? 'text-emerald-600' : reservation.status === 'RELEASED' || reservation.status === 'EXPIRED' ? 'text-rose-600' : 'text-slate-500'
              }`}>
                {reservation.status === 'CONFIRMED' ? 'Settled' : reservation.status === 'RELEASED' ? 'Released' : reservation.status === 'EXPIRED' ? 'Expired' : 'Finalized'}
              </span>
            </div>

            
            <div className="absolute top-4 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-0" />
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Product Name</span>
              </span>
              <span className="text-xs font-extrabold text-slate-700 truncate" title={reservation.productName}>
                {reservation.productName}
              </span>
            </div>
            
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Warehouse Location</span>
              </span>
              <span className="text-xs font-extrabold text-slate-700 truncate" title={reservation.warehouseName}>
                {reservation.warehouseName}
              </span>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Quantity Reserved</span>
              </span>
              <span className="text-xs font-mono font-extrabold text-slate-700">
                {reservation.quantity} Unit{reservation.quantity > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Allocation Time</span>
              </span>
              <span className="text-xs font-bold text-slate-700">
                {new Date(reservation.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>

          
          {isPending && (
            <Countdown secondsLeft={secondsLeft} status={reservation.status} />
          )}

          
          <div className="flex flex-col gap-2 mt-4 border-t border-slate-100 pt-5">
            {isPending ? (
              <>
                <button
                  onClick={() => confirmMutation.mutate()}
                  disabled={isButtonsDisabled}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                >
                  {confirmMutation.isPending ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin text-white" />
                      <span>Recording Clinical Allocation...</span>
                    </>
                  ) : (
                    <span>Confirm Allocation Purchase</span>
                  )}
                </button>
                <button
                  onClick={() => releaseMutation.mutate()}
                  disabled={isButtonsDisabled}
                  className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer select-none"
                >
                  {releaseMutation.isPending ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>Releasing locks...</span>
                    </span>
                  ) : (
                    'Cancel Hold & Release Stock'
                  )}
                </button>
              </>
            ) : (
              <a
                href="/"
                className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-extrabold rounded-xl text-xs transition-all text-center cursor-pointer shadow-sm select-none"
              >
                Create New Hold Request
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
