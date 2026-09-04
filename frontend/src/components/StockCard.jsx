import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp, HelpCircle, ArrowRight, ChevronRight, Activity, Newspaper, BarChart2 } from 'lucide-react';
import AttentionBadge from './AttentionBadge';
import DataStatusPill from './DataStatusPill';
import WhyChangedModal from './WhyChangedModal';

export default function StockCard({ stock, onRemove = null }) {
  const [showModal, setShowModal] = useState(false);

  const deltaSinceCheck = Number(stock.sinceLastCheck || 0);
  const isDrop = deltaSinceCheck < 0;
  const isGain = deltaSinceCheck > 0;
  const absDelta = Math.abs(deltaSinceCheck);

  const dailyDelta = Number(stock.dailyChange || 0);
  const isDailyDrop = dailyDelta < 0;

  // Severity border styling
  const severityBorders = {
    CRITICAL: 'border-l-4 border-l-rose-500 hover:border-rose-500/50',
    IMPORTANT: 'border-l-4 border-l-amber-500 hover:border-amber-500/50',
    WATCH: 'border-l-4 border-l-yellow-500 hover:border-yellow-500/50',
    NORMAL: 'border-l-4 border-l-emerald-500 hover:border-emerald-500/50',
  };
  const borderClass = severityBorders[stock.severity] || severityBorders.NORMAL;

  return (
    <>
      <div
        className={`bg-surface border border-surface-border rounded-xl p-5 transition-all duration-150 hover:bg-surface-hover/60 hover:shadow-lg ${borderClass}`}
      >
        {/* Top Bar: Symbol, Name, Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={`/stocks/${stock.symbol}`}
                className="text-lg font-bold text-white tracking-tight hover:text-brand-500 transition-colors flex items-center gap-1 group"
              >
                <span>{stock.symbol}</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-500 transition-colors" />
              </Link>
              <DataStatusPill status={stock.dataStatus} timestamp={stock.timestamp} />
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">{stock.name || stock.sector || 'Stock Asset'}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AttentionBadge severity={stock.severity} score={stock.attentionScore} />
          </div>
        </div>

        {/* Middle: Price, Daily Change & SINCE LAST CHECK Delta */}
        <div className="mt-4 pt-3 border-t border-surface-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tracking-tight">
                ${Number(stock.price).toFixed(2)}
              </span>
              <span
                className={`text-xs font-semibold font-mono inline-flex items-center ${
                  isDailyDrop ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {isDailyDrop ? <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> : <TrendingUp className="w-3.5 h-3.5 mr-0.5" />}
                {isDailyDrop ? '' : '+'}{dailyDelta.toFixed(2)}% today
              </span>
            </div>
          </div>

          {/* Since Last Check Highlight */}
          <div className="sm:text-right p-2.5 rounded-lg bg-surface-subtle/80 border border-surface-border/70">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Since Your Last Check
            </div>
            <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
              <span
                className={`text-sm font-bold font-mono ${
                  isDrop ? 'text-rose-400' : isGain ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {isDrop ? '-' : isGain ? '+' : ''}{absDelta.toFixed(2)}%
              </span>
              {stock.checkpointPrice && (
                <span className="text-xs text-slate-400 font-mono">
                  (was ${Number(stock.checkpointPrice).toFixed(2)})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Reasons & Signals Badges */}
        <div className="mt-3.5 flex flex-wrap gap-2 items-center">
          {stock.reasons && stock.reasons.map((reason, idx) => {
            let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
            if (reason.type === 'PRICE') {
              badgeClass = isDrop ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
            } else if (reason.type === 'VOLUME') {
              badgeClass = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
            } else if (reason.type === 'EVENT') {
              badgeClass = 'bg-purple-500/10 text-purple-300 border-purple-500/20';
            } else if (reason.type === 'CALM') {
              badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            }

            return (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${badgeClass}`}
              >
                {reason.type === 'VOLUME' && <Activity className="w-3 h-3" />}
                {reason.type === 'EVENT' && <Newspaper className="w-3 h-3" />}
                {reason.type === 'PRICE' && (isDrop ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />)}
                <span className="truncate max-w-[280px]">{reason.text}</span>
              </span>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-100 hover:underline transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why did this change?</span>
          </button>

          <div className="flex items-center gap-3">
            {onRemove && (
              <button
                onClick={() => onRemove(stock.symbol)}
                className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
              >
                Remove
              </button>
            )}
            <Link
              to={`/stocks/${stock.symbol}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white bg-surface-subtle hover:bg-surface-hover px-3 py-1.5 rounded-lg border border-surface-border transition-colors"
            >
              <span>Chart & Analysis</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <WhyChangedModal
        stock={stock}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
