'use strict';
'use client';

import React, { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  CalendarClock,
  Warehouse,
  ShieldCheck,
  X
} from 'lucide-react';

interface SidebarItemProps {
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  isActive: boolean;
}

function SidebarItem({ label, icon: Icon, href, isActive }: SidebarItemProps) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
        isActive
          ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 pl-3'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      <Icon
        className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
          isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
        }`}
      />
      <span>{label}</span>
    </a>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleClose = () => setIsOpen(false);

    window.addEventListener('toggle-sidebar', handleToggle);
    window.addEventListener('close-sidebar', handleClose);

    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
      window.removeEventListener('close-sidebar', handleClose);
    };
  }, []);

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  
  
  const isReservationsRoute = pathname.startsWith('/reservation');

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/?view=dashboard',
      isActive: currentView === 'dashboard' && !isReservationsRoute,
    },
    {
      label: 'Inventory',
      icon: Boxes,
      href: '/?view=inventory',
      isActive: currentView === 'inventory' && !isReservationsRoute,
    },
    {
      label: 'Reservations',
      icon: CalendarClock,
      href: '/?view=reservations',
      isActive: (currentView === 'reservations' || isReservationsRoute),
    },
    {
      label: 'Warehouses',
      icon: Warehouse,
      href: '/?view=warehouses',
      isActive: currentView === 'warehouses' && !isReservationsRoute,
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
        />
      )}

      <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed md:sticky top-0 left-0 shrink-0 select-none z-40 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        <div className="p-6 border-b border-slate-100 flex flex-col gap-1 bg-white">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                Allo Healthcare
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase ml-10">
            Ops Platform
          </span>
        </div>

      
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
        {menuItems.map((item, idx) => (
          <SidebarItem
            key={idx}
            label={item.label}
            icon={item.icon}
            href={item.href}
            isActive={item.isActive}
          />
        ))}
      </nav>

      
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-800 truncate leading-none">
              Neon PostgreSQL
            </span>
            <span className="text-[9px] font-mono text-slate-400 mt-1 truncate leading-none">
              Connection Secure
            </span>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<aside className="w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0" />}>
      <SidebarContent />
    </Suspense>
  );
}
