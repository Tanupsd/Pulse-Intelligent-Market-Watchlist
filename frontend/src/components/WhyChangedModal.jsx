import React from 'react';
import { X, TrendingDown, TrendingUp, AlertCircle, Activity, Newspaper, ShieldAlert, CheckCircle2 } from 'lucide-react';
import AttentionBadge from './AttentionBadge';

export default function WhyChangedModal({ stock, isOpen, onClose }) {
  if (!isOpen || !stock) return null;

  const isDrop = (stock.sinceLastCheck || 0) < 0;
  const isGain = (stock.sinceLastCheck || 0) > 0;
  const absDelta = Math.abs(stock.sinceLastCheck || 0);

  const getConfidenceLevel = (score) => {
    if (score >= 70) return { label: 'HIGH CONFIDENCE', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 40) return { label: 'MODERATE CONFIDENCE', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'LOW / ROUTINE', color: 'text-slate-400 bg-slate-800 border-slate-700' };
  };

  const confidence = getConfidenceLevel(stock.attentionScore || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface border border-surface-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-surface-subtle border border-surface-border">
              <Activity className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Why {stock.symbol} Matters Right Now</h3>
              </div>
              <p className="text-xs text-slate-400">{stock.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Main Movement Callout */}
          <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Change Since Last Check</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-bold font-mono ${isDrop ? 'text-rose-400' : isGain ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {isDrop ? '-' : isGain ? '+' : ''}{absDelta}%
                </span>
                <span className="text-xs text-slate-400">
                  (${stock.checkpointPrice ? stock.checkpointPrice.toFixed(2) : stock.price.toFixed(2)} → ${stock.price.toFixed(2)})
                </span>
              </div>
            </div>
            <AttentionBadge severity={stock.severity} score={stock.attentionScore} />
          </div>

          {/* Signals Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Detected Signals ({stock.reasons ? stock.reasons.length : 0})
              </h4>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border font-semibold ${confidence.color}`}>
                {confidence.label}
              </span>
            </div>

            <div className="space-y-2.5">
              {stock.reasons && stock.reasons.map((reason, idx) => {
                let Icon = AlertCircle;
                let iconColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';

                if (reason.type === 'PRICE') {
                  Icon = isDrop ? TrendingDown : TrendingUp;
                  iconColor = isDrop ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                } else if (reason.type === 'VOLUME') {
                  Icon = Activity;
                  iconColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
                } else if (reason.type === 'EVENT') {
                  Icon = Newspaper;
                  iconColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
                } else if (reason.type === 'CALM') {
                  Icon = CheckCircle2;
                  iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                }

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-surface-subtle/70 border border-surface-border flex items-start gap-3.5"
                  >
                    <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-200 tracking-tight">
                          {reason.type === 'PRICE' ? 'Price Movement' :
                           reason.type === 'VOLUME' ? 'Trading Volume Anomaly' :
                           reason.type === 'EVENT' ? 'Market Event Coincidence' :
                           reason.type === 'BENCHMARK' ? 'Relative Benchmark Decoupling' : 'Market Status'}
                        </span>
                        {reason.metric && (
                          <span className="text-xs font-mono font-medium text-slate-400 bg-surface px-2 py-0.5 rounded border border-surface-border shrink-0">
                            {reason.metric}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {reason.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Non-causal Methodology Disclaimer */}
          <div className="p-3 rounded-xl bg-surface-subtle/40 border border-surface-border/60 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300">Methodology Note:</span> Pulse identifies statistical anomalies and correlated developments that coincided with this price change. Signals are presented to focus your attention, not to assert absolute causality.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-subtle/50 border-t border-surface-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-200 bg-surface-hover hover:bg-slate-700 rounded-lg transition-colors border border-surface-border"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
