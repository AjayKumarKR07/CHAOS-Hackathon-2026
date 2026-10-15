import React, { useState, useEffect } from 'react';
import { Settings, Database, ShieldCheck, ExternalLink, Server, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toolService } from '../services/toolService';
import { getHealthStatus } from '../services/api';
import { ToolRegistryModal } from '../components/ToolRegistryModal';

export function SettingsPage() {
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [toolCount, setToolCount] = useState(7);
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await getHealthStatus();
      setHealthData(data);
    } catch (err) {
      setHealthData({
        status: 'degraded',
        database: {
          engine: 'MongoDB Atlas',
          provider: 'MongoDB Atlas',
          name: 'jarvis_db',
          status: 'unavailable',
          error_detail: 'Unable to reach backend service or MongoDB Atlas cluster',
          checked_at: new Date().toISOString()
        }
      });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    toolService.getTools().then((res) => {
      if (res?.count) setToolCount(res.count);
    }).catch(() => {});
  }, []);

  const isConnected = healthData?.database?.status === 'connected';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-cyan-400" />
            <span>System & Engine Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configuration parameters, database connectivity, and agent runtime policies
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loadingHealth}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Health Check</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Backend & Database Connection */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">MongoDB Atlas Database Status</h3>
                <p className="text-xs text-slate-400">Primary cloud document persistence engine</p>
              </div>
            </div>
            {isConnected ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                MongoDB Atlas Connected
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                MongoDB Atlas Disconnected
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-navy-950/70 border border-white/5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-mono">Database Provider:</span>
              <span className="font-mono text-cyan-300">MongoDB Atlas (Cloud Cluster)</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-mono">Database Name:</span>
              <span className="font-mono text-slate-200">{healthData?.database?.name || 'jarvis_db'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-mono">Cluster Endpoint:</span>
              <span className="font-mono text-slate-300">{healthData?.database?.cluster || 'cluster0.gb0mkaf.mongodb.net'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-mono">Verification Mode:</span>
              <span className="text-emerald-400 font-semibold">Strict Independent Document Query Verification</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-mono">Collections Managed:</span>
              <span className="font-mono text-violet-300">users, tasks, notes, agent_runs, agent_steps, execution_logs</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-mono">Last Health Ping:</span>
              <span className="font-mono text-slate-400">
                {healthData?.database?.checked_at ? new Date(healthData.database.checked_at).toLocaleString() : 'Just now'}
              </span>
            </div>
            {!isConnected && healthData?.database?.error_detail && (
              <div className="pt-2 border-t border-white/5 text-rose-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Connection Error Details: </span>
                  <span>{healthData.database.error_detail}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tool Security Allowlist */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Tool Allowlist & Sandbox Policy</h3>
                <p className="text-xs text-slate-400">{toolCount} registered tools with schema validation</p>
              </div>
            </div>
            <button
              onClick={() => setToolModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-white/10 text-cyan-300 border border-white/10 text-xs font-semibold transition-colors"
            >
              Inspect Tools
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            AI-generated plans cannot execute arbitrary shell commands, raw code strings, or unregistered APIs.
            Every action type must strictly exist within the allowlist and validate against Pydantic models.
          </p>
        </div>

        {/* API Server Details */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Backend REST API</h3>
                <p className="text-xs text-slate-400">FastAPI backend running with OpenAPI specification</p>
              </div>
            </div>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>OpenAPI Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-950/70 border border-white/5 space-y-1 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">Service Endpoint:</span>
              <span className="font-mono text-slate-200">http://127.0.0.1:8000</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono">Health Status:</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {healthData?.status === 'healthy' ? '200 OK (Healthy)' : 'Degraded'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ToolRegistryModal isOpen={toolModalOpen} onClose={() => setToolModalOpen(false)} />
    </div>
  );
}
