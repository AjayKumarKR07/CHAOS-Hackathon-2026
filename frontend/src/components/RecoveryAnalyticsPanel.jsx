import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { agentService } from '../services/agentService';

export function RecoveryAnalyticsPanel({ onStepRecovered }) {
  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recoveringStepId, setRecoveringStepId] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await agentService.getRecoveryAnalytics(dateRange, statusFilter);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load recovery analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, statusFilter]);

  const handleManualRecover = async (runId, stepId) => {
    try {
      setRecoveringStepId(stepId);
      await agentService.retryStep(runId, stepId);
      if (onStepRecovered) onStepRecovered();
      await fetchAnalytics();
    } catch (err) {
      alert(`Recovery failed: ${err.message}`);
    } finally {
      setRecoveringStepId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-bold text-white">Smart Failure Recovery Analytics</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculated from verified MongoDB Atlas execution runs and recovery audit records
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-navy-950/80 p-1 rounded-xl border border-white/10 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer pr-2"
            >
              <option value="all" className="bg-navy-950 text-white">All Time</option>
              <option value="today" className="bg-navy-950 text-white">Today</option>
              <option value="7d" className="bg-navy-950 text-white">Last 7 Days</option>
              <option value="30d" className="bg-navy-950 text-white">Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-navy-950/80 p-1 rounded-xl border border-white/10 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer px-2"
            >
              <option value="ALL" className="bg-navy-950 text-white">All Runs</option>
              <option value="SUCCEEDED" className="bg-navy-950 text-white">Succeeded</option>
              <option value="FAILED" className="bg-navy-950 text-white">Failed</option>
              <option value="PARTIAL" className="bg-navy-950 text-white">Partial</option>
            </select>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-xl bg-navy-850 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 glass-panel rounded-2xl border border-white/5">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-violet-400" />
          <p className="text-xs">Computing analytics from MongoDB Atlas records...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Failed to load analytics: {error}</span>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 font-semibold hover:bg-rose-500/30"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <>
          {/* Recovery KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Recovery Success Rate */}
            <div className="glass-panel rounded-xl p-4 border border-violet-500/30 bg-violet-950/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400 font-medium">Recovery Success Rate</span>
                <TrendingUp className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-extrabold text-violet-300 font-mono">
                {data.recovery_success_rate !== null && data.recovery_success_rate !== undefined
                  ? `${data.recovery_success_rate}%`
                  : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 group relative cursor-help">
                <HelpCircle className="w-3 h-3 text-violet-400/80" />
                <span className="truncate">
                  {data.recovered_failures + data.unresolved_failures > 0
                    ? `${data.recovered_failures} recovered / ${data.recovered_failures + data.unresolved_failures} encountered`
                    : 'No failures yet'}
                </span>
                {/* Tooltip */}
                <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-64 p-2 bg-navy-950 border border-white/10 rounded-lg text-[10px] text-slate-200 shadow-xl z-20">
                  {data.recovery_rate_definition}
                </div>
              </div>
            </div>

            {/* Recovered Failures */}
            <div className="glass-panel rounded-xl p-4 border border-emerald-500/30 bg-emerald-950/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400 font-medium">Recovered Failures</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-300 font-mono">
                {data.recovered_failures}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-1">
                Verified through safe backoff
              </div>
            </div>

            {/* Unresolved Failures */}
            <div className="glass-panel rounded-xl p-4 border border-rose-500/30 bg-rose-950/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400 font-medium">Unresolved Failures</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-extrabold text-rose-300 font-mono">
                {data.unresolved_failures}
              </div>
              <div className="text-[10px] text-rose-400/80 mt-1">
                Action required or non-retryable
              </div>
            </div>

            {/* Total Retry Attempts & Avg Duration */}
            <div className="glass-panel rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400 font-medium">Total Retry Attempts</span>
                <RotateCcw className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {data.retry_attempts}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Avg duration: {data.avg_execution_duration_sec}s
              </div>
            </div>
          </div>

          {/* Detailed Failure & Recovery History Table */}
          <div className="glass-panel rounded-2xl border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Failed Step Recovery Audit Log</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {data.failed_steps_detail.length} recorded failure incidents
              </span>
            </div>

            {data.failed_steps_detail.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-white/5 rounded-xl bg-navy-950/40">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-300">Zero Unresolved Failures</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All actions executed and independently verified cleanly in MongoDB Atlas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase font-mono text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="pb-2.5 font-semibold">Run / Step</th>
                      <th className="pb-2.5 font-semibold">Action & Origin</th>
                      <th className="pb-2.5 font-semibold">Error Message</th>
                      <th className="pb-2.5 font-semibold">Attempts</th>
                      <th className="pb-2.5 font-semibold">Recovery Status</th>
                      <th className="pb-2.5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.failed_steps_detail.map((item) => {
                      const isRecovered = item.recovery_status === 'RECOVERED';
                      const isRetrying = recoveringStepId === item.step_id;

                      return (
                        <tr key={item.step_id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-mono">
                            <span className="text-slate-300 font-bold block">#{item.run_id.slice(-6)}</span>
                            <span className="text-[10px] text-slate-400">Step #{item.step_order}</span>
                          </td>
                          <td className="py-3 font-mono">
                            <div className="text-cyan-300 font-semibold">{item.action_type}</div>
                            <span className={`inline-flex items-center text-[9px] px-1.5 py-0.5 rounded mt-1 border ${
                              item.is_injected
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}>
                              {item.is_injected ? 'Test Mode (Injected)' : 'Genuine Failure'}
                            </span>
                          </td>
                          <td className="py-3 max-w-xs truncate font-mono text-[11px] text-rose-300/90">
                            {item.error_message || 'Timeout / Injected simulated error'}
                          </td>
                          <td className="py-3 font-mono text-slate-300">
                            {item.attempt_count} / {item.max_attempts}
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                              isRecovered
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}>
                              {isRecovered ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertCircle className="w-3 h-3 text-rose-400" />}
                              <span>{item.recovery_status}</span>
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {!isRecovered && item.is_safe_to_retry ? (
                              <button
                                onClick={() => handleManualRecover(item.run_id, item.step_id)}
                                disabled={isRetrying}
                                className="px-2.5 py-1 rounded bg-rose-500 hover:bg-rose-400 text-white font-medium text-[11px] inline-flex items-center gap-1 transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
                              >
                                <RotateCcw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                                <span>{isRetrying ? 'Recovering...' : 'Safe Recover'}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono italic">
                                {isRecovered ? 'Verified' : 'Non-retryable'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
