import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Cpu, Check, Terminal, ExternalLink, Code } from 'lucide-react';
import { toolService } from '../services/toolService';

export function ToolRegistryModal({ isOpen, onClose }) {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      toolService
        .getTools()
        .then((res) => {
          setTools(res.tools || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-cyan-500/30 max-h-[85vh] flex flex-col shadow-2xl shadow-cyan-500/10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Tool Allowlist & Registry
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  Strict Allowlist Enforced
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                All executed actions must match registered schemas. Arbitrary code execution is blocked.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">Loading tool registry specs...</div>
          ) : (
            tools.map((tool) => (
              <div
                key={tool.name}
                className="p-4 rounded-xl bg-navy-950/80 border border-white/10 space-y-2 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono text-sm font-bold text-white">{tool.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tool.is_idempotent && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Idempotent
                      </span>
                    )}
                    {tool.is_safe_to_retry && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Safe Retry Eligible
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{tool.description}</p>

                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Code className="w-3.5 h-3.5 text-violet-400" />
                    <span>Input Schema Validation</span>
                  </div>
                  <pre className="p-2.5 rounded bg-black/40 text-[11px] font-mono text-cyan-300/90 border border-white/5 overflow-x-auto">
                    {JSON.stringify(tool.input_schema, null, 2)}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-navy-950/50 flex items-center justify-between text-xs text-slate-400">
          <span>Security Policy: Enforced by FastAPI & Python allowlist</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
