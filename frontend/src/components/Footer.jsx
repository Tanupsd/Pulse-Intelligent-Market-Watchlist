import React from 'react';
import { Activity, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-surface-border bg-background py-8 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-500" />
          <span className="font-semibold text-slate-400">Pulse</span>
          <span>— Smart Market Watchlist for CODE 2026</span>
        </div>

        <div className="flex items-center gap-2 text-center md:text-right max-w-xl text-[11px] leading-relaxed">
          <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>
            Market information is for informational purposes only and may be delayed. Pulse does not provide financial advice or investment recommendations.
          </span>
        </div>
      </div>
    </footer>
  );
}
