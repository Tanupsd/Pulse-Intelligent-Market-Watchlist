import React from 'react';

export default function AttentionBadge({ severity, score, showScore = true }) {
  const configs = {
    CRITICAL: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-500',
      label: 'Critical',
      emoji: '🔴',
    },
    IMPORTANT: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-500',
      label: 'Important',
      emoji: '🟠',
    },
    WATCH: {
      bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      dot: 'bg-yellow-500',
      label: 'Watch',
      emoji: '🟡',
    },
    NORMAL: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500',
      label: 'Normal',
      emoji: '🟢',
    },
  };

  const config = configs[severity] || configs.NORMAL;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      <span>{config.label}</span>
      {showScore && typeof score === 'number' && (
        <span className="font-mono ml-0.5 opacity-90 font-semibold">{score}</span>
      )}
    </span>
  );
}
