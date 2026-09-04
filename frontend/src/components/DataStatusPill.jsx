import React from 'react';
import { AlertTriangle, Clock, Radio, XCircle } from 'lucide-react';

export default function DataStatusPill({ status = 'LIVE', timestamp = null, showDetails = false }) {
  const configs = {
    LIVE: {
      icon: Radio,
      text: 'Live',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dotColor: 'bg-emerald-400',
    },
    DELAYED: {
      icon: Clock,
      text: 'Delayed (15m)',
      className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      dotColor: 'bg-yellow-400',
    },
    STALE: {
      icon: AlertTriangle,
      text: 'Stale Data',
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      dotColor: 'bg-amber-400',
    },
    UNAVAILABLE: {
      icon: XCircle,
      text: 'Unavailable',
      className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      dotColor: 'bg-rose-400',
    },
  };

  const current = configs[status] || configs.LIVE;
  const Icon = current.icon;

  let timeAgoText = '';
  if (timestamp) {
    const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(timestamp).getTime()) / 60000));
    timeAgoText = diffMinutes >= 60 ? `${Math.floor(diffMinutes / 60)}h ago` : `${diffMinutes}m ago`;
  }

  return (
    <div className="inline-flex flex-col">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${current.className}`}
        title={timestamp ? `Last updated: ${new Date(timestamp).toLocaleTimeString()}` : status}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{current.text}</span>
        {status === 'STALE' && timeAgoText && (
          <span className="text-[11px] opacity-80">({timeAgoText})</span>
        )}
      </span>
      {showDetails && status === 'STALE' && (
        <span className="text-[11px] text-amber-400/90 mt-1">
          ⚠ Market data may be outdated. Showing last cached snapshot.
        </span>
      )}
    </div>
  );
}
