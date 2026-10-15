import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Terminal, 
  Copy, 
  Check, 
  Loader2, 
  ExternalLink,
  Layers,
  Search
} from 'lucide-react';
import { agentService } from '../services/agentService';

export function VerificationEvidenceModal({ isOpen, onClose, runId, stepId, initialStepData = null }) {
  const [loading, setLoading] = useState(false);
  const [evidenceData, setEvidenceData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && runId && stepId) {
      setLoading(true);
      setError(null);
      agentService.getStepEvidence(runId, stepId)
        .then((data) => {
          setEvidenceData(data);
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch verification evidence.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setEvidenceData(null);
      setError(null);
    }
  }, [isOpen, runId, stepId]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (evidenceData) {
      navigator.clipboard.writeText(JSON.stringify(evidenceData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isVerified = evidenceData?.verification_status === 'PASSED';
  const isFailed = evidenceData?.verification_status === 'FAILED' || evidenceData?.status === 'FAILED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl glass-panel rounded-2xl border border-white/10 bg-[#0B1020]/95 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Verification Evidence Inspector</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Step #{evidenceData?.step_order ?? initialStepData?.step_order ?? 1}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {evidenceData?.action_type || initialStepData?.action_type || 'Agent Action'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {loading ? (
            <div className="text-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
              <p className="text-sm font-semibold text-slate-300">Retrieving Verification Audit from MongoDB Atlas...</p>
              <p className="text-xs text-slate-400 mt-1">Directly querying persisted document proof and query history</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Evidence Query Error</span>
              </div>
              <p className="text-xs text-slate-300">{error}</p>
            </div>
          ) : evidenceData ? (
            <>
              {/* Verdict Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isVerified
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isFailed
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                {isVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : isFailed ? (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>
                      {isVerified 
                        ? 'Independent Verification Passed' 
                        : isFailed 
                          ? 'Verification Failed or Action Interrupted' 
                          : 'Pending Execution Verification'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/30 border border-white/10 uppercase">
                      {evidenceData.verification_status}
                    </span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {isVerified 
                      ? 'The agent executed an independent query directly against MongoDB Atlas documents to verify actual state changes rather than assuming model success.'
                      : evidenceData.error_message || 'Verification evidence is not available for this unverified or failed operation.'}
                  </p>
                </div>
              </div>

              {/* Internal Note / Persistence Behavior Callout */}
              {evidenceData.verification_evidence?.internal_note_behavior && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Persistence Target:</span>
                  <span className="text-cyan-300 font-semibold">{evidenceData.verification_evidence.internal_note_behavior}</span>
                </div>
              )}

              {/* Persisted Document Identifiers */}
              {evidenceData.record_ids && Object.keys(evidenceData.record_ids).length > 0 && (
                <div className="rounded-xl bg-navy-950/80 border border-white/10 p-4 space-y-2">
                  <span className="text-slate-400 font-medium block flex items-center gap-1.5 text-xs text-white">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Verified Persisted Document Identifiers</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono">
                    {Object.entries(evidenceData.record_ids).map(([key, val]) => (
                      <div key={key} className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] uppercase tracking-wider">{key}:</span>
                        <span className="text-cyan-300 font-bold text-xs select-all">#{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safe MongoDB Verification Query */}
              <div className="rounded-xl bg-navy-950/80 border border-white/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium block flex items-center gap-1.5 text-xs text-white">
                    <Search className="w-3.5 h-3.5 text-violet-400" />
                    <span>Independent MongoDB Verification Query</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    MongoDB Atlas
                  </span>
                </div>
                <pre className="p-3 rounded-lg bg-black/50 text-cyan-300 font-mono text-xs overflow-x-auto border border-white/5">
                  {evidenceData.query_summary}
                </pre>
              </div>

              {/* Execution Diagnostics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-navy-950/60 border border-white/5">
                  <span className="text-slate-400 text-[10px] block font-medium">Attempt Count</span>
                  <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                    {evidenceData.attempt_count} / {evidenceData.max_attempts}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-navy-950/60 border border-white/5">
                  <span className="text-slate-400 text-[10px] block font-medium">Execution Duration</span>
                  <span className="text-sm font-bold text-cyan-300 font-mono mt-0.5 block">
                    {evidenceData.execution_duration_ms ? `${evidenceData.execution_duration_ms} ms` : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-navy-950/60 border border-white/5">
                  <span className="text-slate-400 text-[10px] block font-medium">Storage Mode</span>
                  <span className="text-xs font-bold font-mono mt-0.5 block truncate">
                    {evidenceData.verification_evidence?.note_persisted === false
                      ? <span className="text-cyan-400">In-Memory Only</span>
                      : <span className="text-emerald-400">Atlas Persisted</span>}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-navy-950/60 border border-white/5">
                  <span className="text-slate-400 text-[10px] block font-medium">Verified Timestamp</span>
                  <span className="text-xs font-bold text-violet-300 font-mono mt-0.5 block truncate">
                    {evidenceData.verification_evidence?.verified_at
                      ? new Date(evidenceData.verification_evidence.verified_at).toLocaleTimeString()
                      : evidenceData.completed_at
                        ? new Date(evidenceData.completed_at).toLocaleTimeString()
                        : 'Live'}
                  </span>
                </div>
              </div>

              {/* Raw Sanitized Evidence Payload */}
              <div className="rounded-xl bg-navy-950/80 border border-white/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Evidence Payload (Sanitized)</span>
                  </span>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
                    <span>{copied ? 'Copied' : 'Copy Evidence'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-black/60 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-48 border border-white/5">
                  {JSON.stringify(evidenceData.verification_evidence || { details: "No evidence recorded for failed action." }, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm">No evidence data available for this step.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cryptographically Verified Execution</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-navy-850 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
