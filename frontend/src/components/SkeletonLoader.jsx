import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-surface/80 border border-surface-border rounded-xl p-5 animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-5 w-20 bg-surface-hover rounded" />
          <div className="h-3.5 w-32 bg-surface-hover/70 rounded" />
        </div>
        <div className="h-6 w-24 bg-surface-hover rounded-full" />
      </div>
      <div className="flex gap-4 items-baseline">
        <div className="h-8 w-28 bg-surface-hover rounded" />
        <div className="h-5 w-16 bg-surface-hover/70 rounded" />
      </div>
      <div className="h-10 bg-surface-subtle border border-surface-border/50 rounded-lg" />
      <div className="flex gap-2">
        <div className="h-6 w-28 bg-surface-hover/60 rounded-full" />
        <div className="h-6 w-24 bg-surface-hover/60 rounded-full" />
      </div>
    </div>
  );
}

export function SummarySkeleton() {
  return (
    <div className="bg-surface/90 border border-surface-border rounded-2xl p-6 animate-pulse space-y-4">
      <div className="h-4 w-36 bg-surface-hover rounded" />
      <div className="h-8 w-64 bg-surface-hover rounded" />
      <div className="flex gap-3">
        <div className="h-7 w-24 bg-surface-hover rounded-full" />
        <div className="h-7 w-24 bg-surface-hover rounded-full" />
        <div className="h-7 w-24 bg-surface-hover rounded-full" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-surface/80 border border-surface-border rounded-xl p-6 animate-pulse space-y-4 h-72 flex flex-col justify-between">
      <div className="flex justify-between">
        <div className="h-6 w-32 bg-surface-hover rounded" />
        <div className="h-6 w-40 bg-surface-hover rounded" />
      </div>
      <div className="h-48 w-full bg-surface-subtle rounded-lg" />
    </div>
  );
}
