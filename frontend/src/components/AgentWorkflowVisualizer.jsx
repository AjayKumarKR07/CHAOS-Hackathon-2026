import React, { useState } from 'react';
import { 
  Bot, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RotateCcw, 
  ArrowRight, 
  Database, 
  ShieldCheck, 
  FileSearch, 
  Sparkles,
  RefreshCw,
  Layers,
  ArrowDown
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export function AgentWorkflowVisualizer({ steps = [], runId, onInspectEvidence, onStepRetried, runStatus = 'PENDING' }) {
  const [retryingStepId, setRetryingStepId] = useState(null);

  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-12 glass-panel rounded-2xl border border-white/5">
        <Sparkles className="w-10 h-10 text-cyan-500/40 mx-auto mb-3 animate-pulse" />
        <p className="text-sm font-semibold text-slate-300">No active workflow pipeline</p>
        <p className="text-xs text-slate-400 mt-1">Submit a natural language task above to generate and execute an agent workflow.</p>
      </div>
    );
  }

  const handleRetry = async (stepId, e) => {
    e.stopPropagation();
    try {
      setRetryingStepId(stepId);
      if (onStepRetried) {
        await onStepRetried(stepId);
      }
    } finally {
      setRetryingStepId(null);
    }
  };

  // Determine High-Level Workflow Pipeline Stage States
  const hasPlan = steps.length > 0;
  const isExecuting = steps.some(s => s.status === 'RUNNING');
  const isVerifying = steps.some(s => s.status === 'RUNNING' || (s.status === 'SUCCEEDED' && s.verification_status === 'UNVERIFIED'));
  const hasFailure = steps.some(s => s.status === 'FAILED');
  const hasRetries = steps.some(s => s.attempt_count > 1 || s.status === 'RETRY_SCHEDULED');
  const isComplete = steps.every(s => s.status === 'SUCCEEDED');
  const isReportReady = runStatus === 'SUCCEEDED' || runStatus === 'FAILED' || runStatus === 'PARTIAL';

  const stages = [
    {
      id: 'plan',
      label: '1. Plan',
      desc: `${steps.length} Tool Actions Planned`,
      status: hasPlan ? 'done' : 'waiting'
    },
    {
      id: 'execute',
      label: '2. Execute',
      desc: isExecuting ? 'Running in Sandbox' : isComplete ? 'All Steps Executed' : hasFailure ? 'Halted at Fault' : 'Ready',
      status: isComplete ? 'done' : isExecuting ? 'active' : hasFailure ? 'failed' : 'waiting'
    },
    {
      id: 'verify',
      label: '3. Verify',
      desc: isComplete ? 'Verified in MongoDB' : isVerifying ? 'Querying Atlas' : hasFailure ? 'Verification Failed' : 'Pending',
      status: isComplete ? 'done' : isVerifying ? 'active' : hasFailure ? 'failed' : 'waiting'
    },
    {
      id: 'recover',
      label: '4. Recover',
      desc: hasFailure ? 'Recovery Available' : hasRetries ? 'Retried & Recovered' : 'Bypassed (Zero Faults)',
      status: hasRetries && isComplete ? 'done' : hasFailure ? 'failed' : 'bypassed'
    },
    {
      id: 'report',
      label: '5. Report',
      desc: isReportReady ? 'Audit Verified' : 'Compiling Outcomes',
      status: isReportReady ? 'done' : 'waiting'
    }
  ];

  return (
    <div className="space-y-6">
      {/* High-Level 5-Stage Agent Lifecycle Bar */}
      <div className="glass-panel rounded-2xl border border-white/10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Agent Pipeline Lifecycle</span>
          </span>
          <span className="text-[11px] font-mono text-cyan-300">
            {runStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {stages.map((st, i) => {
            const isDone = st.status === 'done';
            const isActive = st.status === 'active';
            const isStFailed = st.status === 'failed';
            const isBypassed = st.status === 'bypassed';

            return (
              <div
                key={st.id}
                className={`p-3 rounded-xl border transition-all text-xs relative overflow-hidden ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : isStFailed
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : isActive
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-md shadow-cyan-500/10 animate-pulse'
                        : isBypassed
                          ? 'bg-white/[0.02] border-white/5 text-slate-400'
                          : 'bg-navy-950/50 border-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{st.label}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {isStFailed && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                  {isActive && <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
                </div>
                <p className="text-[10px] opacity-80 truncate">{st.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Tool Action Dependency Graph / Flowchart */}
      <div className="glass-panel rounded-2xl border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white">Visual Step Progression & Tool Actions</h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Click <strong className="text-cyan-300 font-normal">View Evidence</strong> on any step to inspect verified proof
          </span>
        </div>

        {/* Step Nodes Flowchart */}
        <div className="flex flex-col space-y-3">
          {steps.map((step, idx) => {
            const isExecuted = step.status !== 'PENDING';
            const isSucceeded = step.status === 'SUCCEEDED';
            const isFailed = step.status === 'FAILED';
            const isRunning = step.status === 'RUNNING';
            const isRetrying = retryingStepId === step.id;

            return (
              <React.Fragment key={step.id || idx}>
                {/* Connector Arrow from previous step */}
                {idx > 0 && (
                  <div className="flex items-center justify-center my-0.5">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                      <div className="h-4 w-0.5 bg-gradient-to-b from-cyan-500/30 to-violet-500/30" />
                      <span className="opacity-70">depends on Step #{idx} verified output</span>
                    </div>
                  </div>
                )}

                {/* Step Node Card */}
                <div className={`p-4 rounded-xl border transition-all duration-200 ${
                  isSucceeded
                    ? 'bg-navy-900/90 border-emerald-500/30 shadow-md shadow-emerald-500/5'
                    : isFailed
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-500/10'
                      : isRunning
                        ? 'bg-navy-900 border-cyan-500/50 shadow-lg shadow-cyan-500/15'
                        : 'bg-navy-950/40 border-dashed border-white/10 text-slate-400'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Step Identity & Details */}
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 ${
                        isSucceeded
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isFailed
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : isRunning
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                              : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}>
                        #{step.step_order}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            {step.action_type}
                          </span>
                          <StatusBadge status={step.status} size="sm" />
                          <span className="text-[11px] text-slate-400 font-mono">
                            Attempt {step.attempt_count}/{step.max_attempts}
                          </span>
                          {step.verification_status === 'PASSED' && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>MongoDB Verified</span>
                            </span>
                          )}
                        </div>

                        {/* Summary or Planned Input */}
                        <p className="text-xs text-slate-300 leading-relaxed truncate max-w-xl">
                          {step.result_summary || (
                            <span className="italic text-slate-400">
                              Planned action: {JSON.stringify(step.action_input)}
                            </span>
                          )}
                        </p>

                        {/* Error info if failed */}
                        {isFailed && step.error_message && (
                          <p className="text-xs text-rose-300 font-mono bg-rose-500/10 p-2 rounded border border-rose-500/20 break-all">
                            {step.error_message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {isFailed && (
                        <button
                          onClick={(e) => handleRetry(step.id, e)}
                          disabled={isRetrying}
                          className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-500/20 disabled:opacity-50"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                          <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => onInspectEvidence(step)}
                        className="px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <FileSearch className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View Evidence</span>
                      </button>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
