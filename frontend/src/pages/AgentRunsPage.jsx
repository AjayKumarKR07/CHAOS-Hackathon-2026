import React, { useState, useEffect } from 'react';
import { History, Filter, Loader2, Bot, Calendar, ArrowRight, RotateCcw, Layers, Clock, TrendingUp } from 'lucide-react';
import { agentService } from '../services/agentService';
import { StatusBadge } from '../components/StatusBadge';
import { ExecutionTimeline } from '../components/ExecutionTimeline';
import { AgentWorkflowVisualizer } from '../components/AgentWorkflowVisualizer';
import { VerificationEvidenceModal } from '../components/VerificationEvidenceModal';
import { RecoveryAnalyticsPanel } from '../components/RecoveryAnalyticsPanel';

export function AgentRunsPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRun, setSelectedRun] = useState(null);
  const [activeTab, setActiveTab] = useState('drilldown'); // 'drilldown' | 'workflow' | 'analytics'
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const data = await agentService.getRuns();
      setRuns(data || []);
      if (data && data.length > 0 && !selectedRun) {
        setSelectedRun(data[0]);
      }
    } catch (err) {
      console.error('Error fetching agent runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleStepRetried = async (stepId) => {
    if (!selectedRun) return;
    try {
      await agentService.retryStep(selectedRun.id, stepId);
      const updated = await agentService.getRunById(selectedRun.id);
      setSelectedRun(updated);
      await loadRuns();
    } catch (err) {
      console.error('Failed to retry step:', err);
      throw err;
    }
  };

  const filteredRuns = runs.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <History className="w-7 h-7 text-cyan-400" />
            <span>Agent Run History & Audit Logs</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete transparent record of multi-step plans, executed actions, and database proofs
          </p>
        </div>

        {/* View Mode Switching Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('drilldown')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              activeTab !== 'analytics'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'bg-navy-900 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Run History</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              activeTab === 'analytics'
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-sm shadow-violet-500/10'
                : 'bg-navy-900 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Recovery Analytics</span>
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <RecoveryAnalyticsPanel onStepRecovered={loadRuns} />
        </div>
      ) : (
        <>
          {/* Status Filter Bar for Runs */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-2">
            <span className="text-xs text-slate-400 font-mono">Filter by Execution Status:</span>
            <div className="flex items-center gap-2">
              {['ALL', 'SUCCEEDED', 'FAILED', 'PARTIAL'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    statusFilter === s
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-navy-900 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Layout: List on Left, Drilldown on Right */}
          {loading ? (
            <div className="text-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
              <p className="text-xs">Loading execution logs from MongoDB Atlas...</p>
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl border border-white/5">
              <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-300">No agent runs matching filter</p>
              <p className="text-xs text-slate-400 mt-1">Execute tasks from the dashboard to populate the run history.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Runs Sidebar List */}
              <div className="lg:col-span-5 space-y-3">
                {filteredRuns.map((run) => {
                  const isSelected = selectedRun?.id === run.id;
                  return (
                    <div
                      key={run.id}
                      onClick={() => setSelectedRun(run)}
                      className={`glass-panel rounded-xl p-4 border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-cyan-500/50 bg-navy-850 shadow-md shadow-cyan-500/10'
                          : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          RUN #{run.id}
                        </span>
                        <StatusBadge status={run.status} size="sm" />
                      </div>

                      <p className="text-xs font-semibold text-white line-clamp-2 mb-2">
                        {run.original_request}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-white/5">
                        <span>{run.steps?.length || 0} step(s)</span>
                        <span>{new Date(run.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Run Detail View */}
              <div className="lg:col-span-7 space-y-4">
                {selectedRun ? (
                  <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold text-white">Execution Drilldown</h2>
                          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            Run #{selectedRun.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 italic">
                          "{selectedRun.original_request}"
                        </p>
                      </div>
                      <StatusBadge status={selectedRun.status} size="lg" />
                    </div>

                    {/* Report banner */}
                    {selectedRun.execution_summary && (
                      <div className="p-3.5 rounded-xl bg-navy-950/80 border border-white/10 text-xs text-slate-200">
                        <span className="font-bold text-cyan-400">Execution Summary: </span>
                        <span>{selectedRun.execution_summary}</span>
                      </div>
                    )}

                    {/* Step Visualization Switcher */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
                        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                          Execution Pipeline & Verification Proofs
                        </h3>
                        <div className="flex items-center gap-1 bg-navy-950/60 p-1 rounded-lg border border-white/5">
                          <button
                            type="button"
                            onClick={() => setActiveTab('drilldown')}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                              activeTab === 'drilldown'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>Timeline</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('workflow')}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                              activeTab === 'workflow'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Layers className="w-3 h-3" />
                            <span>Workflow Pipeline</span>
                          </button>
                        </div>
                      </div>

                      {activeTab === 'workflow' ? (
                        <AgentWorkflowVisualizer
                          steps={selectedRun.steps}
                          runId={selectedRun.id}
                          runStatus={selectedRun.status}
                          onStepRetried={handleStepRetried}
                          onInspectEvidence={(step) => setSelectedEvidence({ runId: selectedRun.id, stepId: step.id, stepData: step })}
                        />
                      ) : (
                        <ExecutionTimeline
                          steps={selectedRun.steps}
                          runId={selectedRun.id}
                          onStepRetried={handleStepRetried}
                          onInspectEvidence={(step) => setSelectedEvidence({ runId: selectedRun.id, stepId: step.id, stepData: step })}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel rounded-2xl border border-white/5 p-12 text-center text-slate-400">
                    Select a run from the left to inspect its execution breakdown.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Verification Evidence Modal */}
      <VerificationEvidenceModal
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        runId={selectedEvidence?.runId}
        stepId={selectedEvidence?.stepId}
        initialStepData={selectedEvidence?.stepData}
      />
    </div>
  );
}
