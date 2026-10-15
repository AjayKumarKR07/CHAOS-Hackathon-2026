import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Database, 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileSearch
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export function ExecutionTimeline({ steps = [], runId, onStepRetried, onInspectEvidence }) {
  const [expandedSteps, setExpandedSteps] = useState({});
  const [retryingStepId, setRetryingStepId] = useState(null);
  const [retryError, setRetryError] = useState(null);

  const toggleExpand = (stepId) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const handleRetry = async (stepId) => {
    try {
      setRetryingStepId(stepId);
      setRetryError(null);
      if (onStepRetried) {
        await onStepRetried(stepId);
      }
    } catch (err) {
      setRetryError(err.message || 'Retry failed');
    } finally {
      setRetryingStepId(null);
    }
  };

  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-12 glass-panel rounded-2xl border border-white/5">
        <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-pulse" />
        <p className="text-slate-400 font-medium">No execution steps recorded yet.</p>
        <p className="text-xs text-slate-400 mt-1">Submit a task prompt above to initiate a verified execution pipeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {retryError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <span>Failed to retry step: {retryError}</span>
          <button onClick={() => setRetryError(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {steps.map((step, idx) => {
        const isExpanded = expandedSteps[step.id] ?? (step.status === 'FAILED' || idx === steps.length - 1);
        const isFailed = step.status === 'FAILED';
        const isSucceeded = step.status === 'SUCCEEDED';
        const isRunning = step.status === 'RUNNING';
        const isRetrying = retryingStepId === step.id;

        return (
          <div
            key={step.id || idx}
            className={`glass-panel rounded-xl border transition-all duration-300 overflow-hidden ${
              isFailed
                ? 'border-rose-500/40 bg-rose-950/10 shadow-lg shadow-rose-500/5'
                : isSucceeded
                  ? 'border-emerald-500/30 bg-navy-900/80 shadow-md shadow-emerald-500/5'
                  : isRunning
                    ? 'border-cyan-500/40 bg-navy-900/90 shadow-lg shadow-cyan-500/10'
                    : 'border-white/10 bg-navy-900/60'
            }`}
          >
            {/* Step Header */}
            <div
              onClick={() => toggleExpand(step.id)}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                {/* Step Order Circle */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                    isSucceeded
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isFailed
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : isRunning
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {step.step_order}
                </div>

                {/* Action Type Badge */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-200">
                      {step.action_type}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      Attempt {step.attempt_count}/{step.max_attempts}
                    </span>
                  </div>
                  {step.result_summary && (
                    <p className="text-xs text-slate-300 mt-1 max-w-xl truncate">
                      {step.result_summary}
                    </p>
                  )}
                </div>
              </div>

              {/* Status, Evidence and Toggle */}
              <div className="flex items-center gap-2.5">
                <StatusBadge status={step.status} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onInspectEvidence) onInspectEvidence(step);
                  }}
                  className="px-2.5 py-1 rounded bg-navy-850 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all"
                  title="Inspect Verification Evidence"
                >
                  <FileSearch className="w-3 h-3 text-cyan-400" />
                  <span className="hidden sm:inline">View Evidence</span>
                </button>
                <button
                  type="button"
                  className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Expandable Details Container */}
            {isExpanded && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-white/5 space-y-4 text-xs">
                {/* Error Banner & Safe Recovery Button */}
                {isFailed && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-rose-300">Failure Detected during Execution or Verification</p>
                        <p className="font-mono text-[11px] text-rose-200/90 mt-1 bg-black/30 p-2 rounded border border-rose-500/20 break-all">
                          {step.error_message || 'Unknown operational failure'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-rose-300/80">
                        Idempotency token preserved. Safe recovery available.
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetry(step.id);
                        }}
                        disabled={isRetrying}
                        className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-medium flex items-center gap-1.5 transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                        <span>{isRetrying ? 'Retrying Step...' : 'Retry Step Now'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Verification Evidence Inspector */}
                <div className="rounded-xl bg-navy-950/70 border border-white/5 p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-200 font-semibold">
                      <Database className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Post-Action Database Verification</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        step.verification_status === 'PASSED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : step.verification_status === 'FAILED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      VERIFICATION {step.verification_status || 'UNVERIFIED'}
                    </span>
                  </div>

                  {step.verification_evidence ? (
                    <div className="space-y-1.5">
                      <p className="text-slate-400 text-[11px]">
                        The agent performed an independent query to verify state persistence:
                      </p>
                      <pre className="p-2.5 rounded bg-black/40 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-white/5">
                        {JSON.stringify(step.verification_evidence, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">
                      Verification pending step execution.
                    </p>
                  )}
                </div>

                {/* Inputs and Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-navy-950/50 border border-white/5 p-3">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">
                      Action Input Parameters
                    </span>
                    <pre className="p-2 rounded bg-black/30 text-slate-300 font-mono text-[11px] overflow-x-auto">
                      {JSON.stringify(step.action_input, null, 2)}
                    </pre>
                  </div>

                  {step.result_data && (
                    <div className="rounded-xl bg-navy-950/50 border border-white/5 p-3">
                      <span className="text-[11px] font-medium text-slate-400 block mb-1">
                        Tool Result Payload
                      </span>
                      <pre className="p-2 rounded bg-black/30 text-emerald-300/90 font-mono text-[11px] overflow-x-auto">
                        {JSON.stringify(step.result_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Idempotency Audit Token */}
                {step.idempotency_key && (
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                    <span>Idempotency Key: {step.idempotency_key}</span>
                    <span>Created: {new Date(step.created_at).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
