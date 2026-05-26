import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-pulse">
      
      <div className="flex justify-between items-center border-b border-slate-200/80 pb-5">
        <div className="flex flex-col gap-2 w-full">
          <div className="h-6 w-72 bg-slate-200 rounded-md" />
          <div className="h-4 w-96 bg-slate-200 rounded-md" />
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 rounded-2xl border border-slate-200 bg-white h-32 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2 w-1/2">
                <div className="h-3 bg-slate-100 rounded" />
                <div className="h-7 bg-slate-200 rounded-md mt-1" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
            </div>
            <div className="h-3 w-3/4 bg-slate-100 rounded mt-4" />
          </div>
        ))}
      </div>

      
      <div className="flex flex-col gap-4 mt-2">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-6 h-72 flex flex-col justify-between"
            >
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="h-6 w-1/2 bg-slate-200 rounded-md" />
                  <div className="h-5 w-16 bg-slate-100 rounded-full" />
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-4 w-full bg-slate-100 rounded" />
                  <div className="h-4 w-5/6 bg-slate-100 rounded" />
                  <div className="h-4 w-4/6 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-10 bg-slate-200 rounded-xl mt-6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
