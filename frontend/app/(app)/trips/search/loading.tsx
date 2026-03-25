import React from 'react';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-2.5 bg-slate-100 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="h-2.5 bg-slate-100 rounded w-1/4" />
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-2 text-right">
          <div className="h-2.5 bg-slate-100 rounded w-1/3 ml-auto" />
          <div className="h-4 bg-slate-100 rounded w-2/3 ml-auto" />
          <div className="h-2.5 bg-slate-100 rounded w-1/4 ml-auto" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="h-3 bg-slate-100 rounded w-1/3" />
        <div className="h-6 bg-slate-100 rounded-lg w-20" />
      </div>
      <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
        <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-2.5 bg-slate-100 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

export default function TripsSearchLoading() {
  return (
    <div style={{ background: 'var(--color-soft-gray)', minHeight: '100vh' }}>
      {/* hero skeleton */}
      <div
        className="animate-pulse"
        style={{
          background: 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#1d4ed8 100%)',
          padding: '2.5rem 1rem',
        }}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-5 bg-white/10 rounded-full w-40 mx-auto" />
          <div className="h-9 bg-white/10 rounded-xl w-64 mx-auto" />
          <div className="h-4 bg-white/10 rounded w-72 mx-auto" />
          <div className="mt-6 flex gap-3">
            <div className="flex-1 h-12 bg-white/10 rounded-xl" />
            <div className="flex-1 h-12 bg-white/10 rounded-xl" />
            <div className="w-36 h-12 bg-white/10 rounded-xl" />
          </div>
        </div>
      </div>

      {/* grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
          <div className="h-9 bg-slate-200 rounded-xl w-40 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  );
}
