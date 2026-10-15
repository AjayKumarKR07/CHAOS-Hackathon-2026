import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Loader2, RotateCcw, AlertTriangle } from 'lucide-react';

export function StatusBadge({ status, size = 'md' }) {
  const normStatus = (status || 'PENDING').toUpperCase();

  const configs = {
    SUCCEEDED: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
      label: 'Succeeded',
      dot: 'bg-emerald-400',
    },
    RUNNING: {
      bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      icon: Loader2,
      spin: true,
      label: 'Running',
      dot: 'bg-cyan-400 animate-ping',
    },
    PENDING: {
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      icon: Clock,
      label: 'Pending',
      dot: 'bg-slate-400',
    },
    FAILED: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: AlertCircle,
      label: 'Failed',
      dot: 'bg-rose-400',
    },
    PARTIAL: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: AlertTriangle,
      label: 'Partially Completed',
      dot: 'bg-amber-400',
    },
    RETRY_SCHEDULED: {
      bg: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
      icon: RotateCcw,
      spin: true,
      label: 'Retry Scheduled',
      dot: 'bg-violet-400 animate-pulse',
    },
    SKIPPED: {
      bg: 'bg-slate-700/20 text-slate-400 border-slate-600/30',
      icon: Clock,
      label: 'Skipped',
      dot: 'bg-slate-500',
    },
  };

  const config = configs[normStatus] || configs.PENDING;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1.5' 
    : size === 'lg' 
      ? 'px-3 py-1.5 text-sm gap-2' 
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon className={`w-3.5 h-3.5 ${config.spin ? 'animate-spin' : ''}`} />
      <span>{config.label}</span>
    </span>
  );
}
