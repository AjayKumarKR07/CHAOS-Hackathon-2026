import React from 'react';
import { Bot, ShieldCheck, Database, Cpu, Terminal, GitBranch } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-950/80 backdrop-blur-md py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand overview */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-navy-950 font-bold">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white">JARVIS</span>
            <span className="text-[11px] text-cyan-400 font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              CHAOS-Hackathon-2026
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-4">
            A reliable personal AI agent designed to execute multi-step tasks across connected tools, 
            independently verify system outcomes in MongoDB Atlas, and recover gracefully when actions fail.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Allowlist Enforced</span>
            </div>
            <div className="flex items-center gap-1.5 text-violet-400">
              <Database className="w-3.5 h-3.5" />
              <span>MongoDB Atlas Verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>Bounded Retries</span>
            </div>
          </div>
        </div>

        {/* Core Pillars */}
        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Architectural Pillars</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="hover:text-cyan-400 transition-colors">10-Stage Execution Lifecycle</li>
            <li className="hover:text-cyan-400 transition-colors">Independent Verification Engine</li>
            <li className="hover:text-cyan-400 transition-colors">Fault Injection & Recovery</li>
            <li className="hover:text-cyan-400 transition-colors">Cryptographic Idempotency Keys</li>
            <li className="hover:text-cyan-400 transition-colors">JWT Session Isolation</li>
          </ul>
        </div>

        {/* Technology Stack */}
        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Technology Stack</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>FastAPI & Python 3.11</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>React & Vite & Tailwind CSS</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span>MongoDB Atlas & PyMongo</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Pydantic v2 Request Guards</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p>© 2026 JARVIS Personal AI Agent. Built for CHAOS Hackathon.</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-400 hover:text-slate-200">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive REST API (/docs)</span>
          </span>
          <span>•</span>
          <span className="text-emerald-400 flex items-center gap-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System Healthy
          </span>
        </div>
      </div>
    </footer>
  );
}
