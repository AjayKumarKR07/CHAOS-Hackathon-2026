import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  RotateCcw, 
  History, 
  Layers, 
  Zap, 
  Terminal, 
  Cpu, 
  Play, 
  AlertTriangle,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ToolRegistryModal } from '../components/ToolRegistryModal';

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [demoState, setDemoState] = useState('idle'); // idle, running, verified, failed
  const [demoSimulateFailure, setDemoSimulateFailure] = useState(false);

  const runDemo = () => {
    setDemoState('running');
    setTimeout(() => {
      if (demoSimulateFailure) {
        setDemoState('failed');
      } else {
        setDemoState('verified');
      }
    }, 1200);
  };

  const recoverDemo = () => {
    setDemoState('running');
    setTimeout(() => {
      setDemoState('verified');
    }, 900);
  };

  return (
    <div className="relative overflow-hidden bg-navy-950">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-violet-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-80 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 left-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto pt-20 pb-24 px-4 sm:px-6 lg:px-8 text-center">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-850/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-8 shadow-lg shadow-cyan-500/10">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>CHAOS Hackathon 2026 • Verified Autonomous Agent</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] mb-6">
          Your Personal AI.{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-400 bg-clip-text text-transparent">
            Your Tasks. Done.
          </span>
        </h1>

        {/* Supporting description */}
        <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          A high-assurance autonomous agent that converts natural language into structured plans, 
          executes actions across connected tools,{' '}
          <strong className="text-cyan-400 font-semibold">independently verifies state in MongoDB Atlas</strong>, 
          and recovers gracefully when an action fails.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-navy-950 font-extrabold text-base transition-all shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 group"
          >
            <span>{isAuthenticated ? 'Open Agent Dashboard' : 'Get Started Free'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to={isAuthenticated ? "/tasks" : "/login"}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl glass-panel hover:bg-white/10 text-slate-200 font-semibold text-base transition-all border border-white/15 flex items-center justify-center gap-2"
          >
            <span>{isAuthenticated ? 'Manage Tasks' : 'Sign In'}</span>
          </Link>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-white/10 text-left">
          <div className="p-3">
            <div className="text-2xl font-bold text-cyan-400 font-mono">100%</div>
            <div className="text-xs text-slate-400">Tool Allowlist Enforced</div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-bold text-violet-400 font-mono">10-Step</div>
            <div className="text-xs text-slate-400">Execution Lifecycle</div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-bold text-emerald-400 font-mono">Real SQL</div>
            <div className="text-xs text-slate-400">State Verification</div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-bold text-blue-400 font-mono">Bounded</div>
            <div className="text-xs text-slate-400">Backoff Recovery</div>
          </div>
        </div>
      </section>

      {/* Interactive Sample Execution Workflow Visualization */}
      <section id="live-demo" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Live Architecture Demonstration</h2>
          <h3 className="text-3xl font-extrabold text-white">How JARVIS Executes & Verifies Actions</h3>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto mt-2">
            Experience the difference between a naive chatbot and a verified agent. Try toggling simulated failure to observe automated fault detection!
          </p>
        </div>

        {/* Interactive Simulator Box */}
        <div className="glass-panel rounded-2xl border border-white/15 p-6 sm:p-8 shadow-2xl shadow-cyan-500/5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-mono">Sample Request</span>
                <p className="text-sm font-semibold text-white">"Schedule pitch deck review, log security note, and summarize tasks"</p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Failure Toggle */}
              <label className="flex items-center gap-2 cursor-pointer bg-navy-900 px-3 py-1.5 rounded-lg border border-white/10 hover:border-rose-500/40 transition-colors">
                <input
                  type="checkbox"
                  checked={demoSimulateFailure}
                  onChange={(e) => setDemoSimulateFailure(e.target.checked)}
                  className="rounded bg-navy-950 border-white/20 text-rose-500 focus:ring-rose-500/40"
                />
                <span className="text-xs text-slate-300 flex items-center gap-1 font-mono">
                  <AlertTriangle className={`w-3.5 h-3.5 ${demoSimulateFailure ? 'text-rose-400' : 'text-slate-400'}`} />
                  Inject Simulated Failure
                </span>
              </label>

              {/* Run Button */}
              <button
                onClick={runDemo}
                disabled={demoState === 'running'}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{demoState === 'running' ? 'Executing Plan...' : 'Simulate Run'}</span>
              </button>
            </div>
          </div>

          {/* Workflow Step Progression */}
          <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className={`p-4 rounded-xl border transition-all ${
              demoState === 'idle'
                ? 'bg-navy-900/50 border-white/10'
                : demoState === 'running'
                  ? 'bg-cyan-950/20 border-cyan-500/40 shadow-md shadow-cyan-500/10'
                  : 'bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-500/10'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-cyan-400 font-bold">STEP 1 • task.create</span>
                {demoState === 'verified' || demoState === 'failed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : demoState === 'running' ? (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                ) : (
                  <span className="text-[10px] text-slate-400">Ready</span>
                )}
              </div>
              <p className="text-sm font-semibold text-white">Create Task: Pitch Deck Review</p>
              <div className="mt-3 p-2 rounded bg-black/40 text-[10px] font-mono text-slate-400 border border-white/5">
                {demoState === 'verified' || demoState === 'failed' ? (
                  <span className="text-emerald-400">✓ Document verified in MongoDB Atlas</span>
                ) : (
                  <span>Awaiting execution dispatcher...</span>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-xl border transition-all ${
              demoState === 'idle'
                ? 'bg-navy-900/50 border-white/10'
                : demoState === 'running'
                  ? 'bg-navy-900/80 border-cyan-500/30'
                  : demoState === 'failed'
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-500/10'
                    : 'bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-500/10'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-violet-400 font-bold">STEP 2 • note.create</span>
                {demoState === 'failed' ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">FAILED</span>
                ) : demoState === 'verified' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-[10px] text-slate-400">Queued</span>
                )}
              </div>
              <p className="text-sm font-semibold text-white">Create Note: Security Checklist</p>
              <div className="mt-3 p-2 rounded bg-black/40 text-[10px] font-mono text-slate-400 border border-white/5">
                {demoState === 'failed' ? (
                  <span className="text-rose-400">SimulatedToolError: Gateway timeout (Safe retry available)</span>
                ) : demoState === 'verified' ? (
                  <span className="text-emerald-400">✓ Note #58 content confirmed in DB</span>
                ) : (
                  <span>Dependent on Step 1</span>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-xl border transition-all ${
              demoState === 'verified'
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-500/10'
                : 'bg-navy-900/50 border-white/10 opacity-75'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-blue-400 font-bold">STEP 3 • summary.generate</span>
                {demoState === 'verified' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-[10px] text-slate-400">Queued</span>
                )}
              </div>
              <p className="text-sm font-semibold text-white">Daily Briefing Rollup</p>
              <div className="mt-3 p-2 rounded bg-black/40 text-[10px] font-mono text-slate-400 border border-white/5">
                {demoState === 'verified' ? (
                  <span className="text-emerald-400">✓ Evaluated 12 tasks & compiled summary</span>
                ) : (
                  <span>Pending Step 2 resolution</span>
                )}
              </div>
            </div>
          </div>

          {/* Recovery Banner if demo failed */}
          {demoState === 'failed' && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-rose-300">Failure Detected & Isolated</h4>
                  <p className="text-xs text-slate-300">
                    Step 2 failed cleanly without corrupting previous steps. Click below to execute a safe idempotent recovery!
                  </p>
                </div>
              </div>
              <button
                onClick={recoverDemo}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-500/20 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recover & Re-Verify Step</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Core Differentiators</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Engineered for Reliability, Not Just Chat</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Multi-Step Automation</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Breaks complex natural language instructions into ordered, dependency-aware plans.
                Executes tasks in logical sequence with clear dependency tracking.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6 text-xs text-cyan-400 font-mono">
              Ordered Execution Graph
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                <Database className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Independent Verification</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Never assumes success. JARVIS queries the MongoDB Atlas database post-execution, verifies
                persisted entities, and records verifiable proof before marking any step complete.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6 text-xs text-emerald-400 font-mono">
              Zero Assumed Success
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-6">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Failure Recovery & Retries</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Detects timeouts, API disruptions, and input anomalies. Categorizes errors, prevents duplicate
                actions via idempotency keys, and provides one-click safe recovery.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6 text-xs text-violet-400 font-mono">
              Bounded Exponential Backoff
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Controlled Tool Registry</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Strict allowlist policy. AI-generated actions are strictly validated against tool parameter
                schemas. Arbitrary shell commands or code execution are strictly blocked.
              </p>
            </div>
            <button
              onClick={() => setToolModalOpen(true)}
              className="pt-6 border-t border-white/5 mt-6 text-xs text-cyan-400 font-mono flex items-center gap-1 hover:underline text-left"
            >
              <span>Inspect Allowlist Schemas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 5 */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
                <History className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Complete Task Audit Trail</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Full run and step histories are saved in MongoDB Atlas collections with attempt counts, execution
                timings, input parameters, and verification evidence for complete observability.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6 text-xs text-amber-400 font-mono">
              MongoDB Atlas Cloud Logs
            </div>
          </div>

          {/* Card 6 */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 sm:p-8 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Secure User Isolation</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                JWT bearer authentication, bcrypt password hashing, and user-level tenant boundaries.
                Users cannot access or modify tasks, notes, or execution logs belonging to others.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 mt-6 text-xs text-purple-400 font-mono">
              Tenant Boundary Enforced
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">System Lifecycle</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">How JARVIS Handles Every Request</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 relative">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs mb-4">
              01
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Decompose & Plan</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Analyzes natural language instructions and translates them into an ordered sequence of actionable steps with dependencies.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 relative">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-mono font-bold flex items-center justify-center text-xs mb-4">
              02
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Allowlist Validation</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Verifies every step against permitted tool registry and validates parameter types against Pydantic schemas.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs mb-4">
              03
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Execute & Verify</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dispatches action to the tool, commits state, and executes an independent database verification check.
            </p>
          </div>

          {/* Step 4 */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 relative">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 font-mono font-bold flex items-center justify-center text-xs mb-4">
              04
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Transparent Report</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Outputs full audit report showing verified records, failed actions, and provides retry triggers for remaining steps.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="glass-panel rounded-3xl p-10 sm:p-14 border border-cyan-500/30 bg-gradient-to-b from-navy-900 to-navy-950 relative overflow-hidden shadow-2xl shadow-cyan-500/10">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-6">
            <Bot className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to experience verified AI task automation?
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            Create your account now and test multi-step execution, database verification, and failure recovery in action.
          </p>
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-navy-950 font-bold transition-all shadow-xl shadow-cyan-500/20"
          >
            <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started with JARVIS'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Tool Modal */}
      <ToolRegistryModal isOpen={toolModalOpen} onClose={() => setToolModalOpen(false)} />
    </div>
  );
}
