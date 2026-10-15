import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Database, 
  Layers, 
  History, 
  ShieldCheck, 
  Plus, 
  Loader2, 
  ArrowRight,
  TrendingUp,
  ListTodo,
  FileText,
  Mic,
  MicOff,
  Square
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { agentService } from '../services/agentService';
import { taskService } from '../services/taskService';
import { noteService } from '../services/noteService';
import { ExecutionTimeline } from '../components/ExecutionTimeline';
import { AgentWorkflowVisualizer } from '../components/AgentWorkflowVisualizer';
import { VerificationEvidenceModal } from '../components/VerificationEvidenceModal';
import { RecoveryAnalyticsPanel } from '../components/RecoveryAnalyticsPanel';
import { StatusBadge } from '../components/StatusBadge';
import { ToolRegistryModal } from '../components/ToolRegistryModal';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuth();
  const [requestText, setRequestText] = useState('');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [currentRun, setCurrentRun] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('workflow'); // 'workflow' | 'timeline' | 'analytics'
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  // Voice Command States
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle' | 'listening' | 'captured' | 'error'
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef('');
  const isSpeechSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Suggestions for prompt
  const suggestions = [
    "Create an urgent task for AI model audit, take a note about benchmark scores, and summarize my workload",
    "Add a high-priority task to deploy MongoDB replica set, take a note about connection pooling, and send alert",
    "Review all tasks and draft an executive briefing note",
    "Schedule database backup task, write security checklist note, and trigger notification"
  ];

  const loadDashboardData = async () => {
    try {
      const [statsData, runsData] = await Promise.all([
        agentService.getStats().catch(() => null),
        agentService.getRuns().catch(() => []),
      ]);
      if (statsData) setStats(statsData);
      if (runsData && runsData.length > 0) {
        setRecentRuns(runsData.slice(0, 5));
        // If no run currently selected, default to latest
        if (!currentRun) {
          setCurrentRun(runsData[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Cleanup speech recognition on page unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleStartListening = () => {
    setVoiceError(null);
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setVoiceError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setVoiceStatus('error');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      baseTextRef.current = requestText.trim();

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus('listening');
        setVoiceError(null);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const recognizedPiece = (final || interim).trim();
        if (recognizedPiece) {
          const combined = baseTextRef.current 
            ? `${baseTextRef.current} ${recognizedPiece}` 
            : recognizedPiece;
          setRequestText(combined);
        }

        if (final) {
          setVoiceStatus('captured');
        }
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        setVoiceStatus('error');
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech was detected. Please click the microphone and speak your command.');
        } else if (event.error === 'network') {
          setVoiceError('Network error occurred during speech recognition. Please check your connection.');
        } else if (event.error === 'aborted') {
          setVoiceStatus('idle');
          setVoiceError(null);
        } else {
          setVoiceError(`Voice recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceStatus((prev) => (prev === 'listening' ? 'captured' : prev));
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setVoiceStatus('error');
      setVoiceError(err.message || 'Could not access speech recognition service.');
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setVoiceStatus((prev) => (prev === 'listening' ? (requestText.trim() ? 'captured' : 'idle') : prev));
  };

  const handleToggleVoice = () => {
    if (isListening) {
      handleStopListening();
    } else {
      handleStartListening();
    }
  };

  const handleRunTask = async (e) => {
    if (e) e.preventDefault();
    if (isRunning) return; // Prevent duplicate concurrent submissions
    if (!requestText.trim()) return;

    if (isListening) {
      handleStopListening();
    }

    setError(null);
    setIsRunning(true);

    try {
      const run = await agentService.triggerRun(requestText, simulateFailure);
      setCurrentRun(run);
      setActiveTab('workflow');
      // Reload stats and run history
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Execution failed. Please check inputs.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleStepRetried = async (stepId) => {
    if (!currentRun) return;
    try {
      await agentService.retryStep(currentRun.id, stepId);
      // Refresh current run data
      const updatedRun = await agentService.getRunById(currentRun.id);
      setCurrentRun(updatedRun);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to retry step:', err);
      throw err;
    }
  };

  const handleRetryEntireRun = async () => {
    if (!currentRun) return;
    try {
      setIsRunning(true);
      const retriedRun = await agentService.retryEntireRun(currentRun.id);
      setCurrentRun(retriedRun);
      await loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to retry run');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Agent Command Center</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
              Live Verified Mode
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Logged in as <strong className="text-slate-200">{user?.full_name || user?.email}</strong> • Verified actions commit directly to MongoDB Atlas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setToolModalOpen(true)}
            className="px-3.5 py-2 rounded-xl glass-panel hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors border border-white/10"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Tool Allowlist & Schemas</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Total Agent Runs</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {stats?.total_runs ?? recentRuns.length}
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1 flex items-center gap-1">
            <span>{stats?.successful_runs ?? 0} Succeeded</span>
            <span>•</span>
            <span className="text-rose-400">{stats?.failed_runs ?? 0} Failed</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Verification Success Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {stats?.success_rate ?? 100}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats?.total_steps_executed ?? 0} Verified tool executions
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Active Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {stats?.total_tasks ?? 0}
          </div>
          <Link to="/tasks" className="text-[11px] text-blue-400 hover:underline mt-1 block">
            View Tasks Table →
          </Link>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Saved Notes</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {stats?.total_notes ?? 0}
          </div>
          <Link to="/notes" className="text-[11px] text-violet-400 hover:underline mt-1 block">
            View Notes Repository →
          </Link>
        </div>
      </div>

      {/* Main Task Execution Center */}
      <div className="glass-panel rounded-2xl border border-cyan-500/30 p-6 sm:p-8 shadow-xl shadow-cyan-500/5 relative overflow-hidden">
        {/* Subtle accent border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />

        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Natural Language Task Execution</h2>
            </div>
            {/* Visual State: Ready to listen | Listening | Voice captured | Voice recognition error */}
            {voiceStatus === 'idle' && (
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/25"
                title="Microphone ready for hands-free voice input"
              >
                <Mic className="w-3 h-3 text-cyan-400" />
                <span>Ready to listen</span>
              </span>
            )}
            {voiceStatus === 'listening' && (
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/35 animate-pulse"
                title="Speech recognition is actively listening"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                <span className="font-semibold">Listening...</span>
              </span>
            )}
            {voiceStatus === 'captured' && (
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                title="Spoken command successfully captured into input"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Voice captured</span>
              </span>
            )}
            {voiceStatus === 'error' && (
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/35"
                title={voiceError || 'Voice recognition error'}
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>Voice recognition error</span>
              </span>
            )}
          </div>

          {/* Controlled Test Mode Failure Injection Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer bg-navy-950/80 px-3 py-1.5 rounded-xl border border-white/15 hover:border-rose-500/40 transition-colors">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              className="rounded bg-navy-900 border-white/20 text-rose-500 focus:ring-rose-500/40"
            />
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <AlertTriangle className={`w-3.5 h-3.5 ${simulateFailure ? 'text-rose-400' : 'text-slate-400'}`} />
              <span className={simulateFailure ? 'text-rose-300 font-semibold' : 'text-slate-300'}>
                Simulate Injected Failure (Test Mode)
              </span>
            </div>
          </label>
        </div>

        {/* Prompt Input Box */}
        <form onSubmit={handleRunTask} className="space-y-3">
          <div className="relative">
            <textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="Give JARVIS a multi-step instruction, e.g. 'Create an urgent task to review API security, write a note with findings, and generate a daily briefing'..."
              rows={3}
              required
              className="w-full p-4 pr-14 rounded-xl glass-input text-white text-sm placeholder:text-slate-500 resize-none font-sans leading-relaxed focus:border-cyan-500/50"
            />

            {/* Quick In-Textarea Microphone Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              disabled={isRunning}
              title={
                isListening 
                  ? 'Stop Listening' 
                  : isSpeechSupported 
                    ? 'Voice Input: Ready to listen (Click to speak)' 
                    : 'Speech recognition not supported in this browser'
              }
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              className={`absolute right-3.5 bottom-3.5 p-2 rounded-xl transition-all flex items-center justify-center ${
                isListening
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50'
                  : 'bg-navy-950/80 hover:bg-cyan-500/20 text-cyan-400 border border-white/10 hover:border-cyan-500/40'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isListening ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Voice State Notification Banners */}
          {voiceStatus === 'listening' && (
            <div 
              role="status" 
              aria-live="polite"
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="font-semibold text-rose-200">Listening...</span>
                <span className="text-slate-300 hidden sm:inline">Speak your English command into the microphone.</span>
              </div>
              <button
                type="button"
                onClick={handleStopListening}
                className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop Listening</span>
              </button>
            </div>
          )}

          {voiceStatus === 'captured' && (
            <div 
              role="status" 
              aria-live="polite"
              className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Voice captured:</strong> Review or edit the recognized text above, then click <strong>Execute Task</strong>.</span>
              </div>
              <button
                type="button"
                onClick={() => setVoiceStatus('idle')}
                className="text-slate-400 hover:text-white text-xs px-1 font-mono"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {voiceStatus === 'error' && voiceError && (
            <div 
              role="alert" 
              aria-live="assertive"
              className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>Voice recognition notice:</strong> {voiceError}</span>
              </div>
              <button
                type="button"
                onClick={() => { setVoiceError(null); setVoiceStatus('idle'); }}
                className="text-slate-400 hover:text-white text-xs px-1.5 font-mono"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Quick Prompt Suggestions */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              <span className="text-[11px] text-slate-400 uppercase font-mono tracking-wider shrink-0">Try:</span>
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRequestText(sug)}
                  className="px-2.5 py-1 rounded-lg bg-navy-950/90 hover:bg-white/10 text-[11px] text-slate-300 border border-white/10 whitespace-nowrap transition-colors shrink-0 max-w-[240px] truncate"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Run Button & Voice Trigger */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                type="button"
                onClick={handleToggleVoice}
                disabled={isRunning}
                title={
                  isListening 
                    ? 'Stop listening' 
                    : isSpeechSupported 
                      ? 'Voice Input: Ready to listen (Click to speak)' 
                      : 'Speech recognition not supported in this browser'
                }
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30 animate-pulse'
                    : 'glass-panel hover:bg-white/10 text-slate-200 border-white/10'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isListening ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-cyan-400" />
                    <span className="hidden sm:inline">Voice Input</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isRunning || !requestText.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-navy-950 font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Planning & Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Execute Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Live / Selected Execution Workspace */}
      <div className="space-y-4">
        {/* Workspace Header & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">
                {activeTab === 'workflow' ? 'Visual Agent Workflow' : activeTab === 'timeline' ? 'Execution Timeline' : 'Smart Failure Recovery Analytics'}
              </h3>
              {currentRun && (
                <>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    Run #{currentRun.id}
                  </span>
                  <StatusBadge status={currentRun.status} />
                </>
              )}
            </div>
            {currentRun && (
              <p className="text-xs text-slate-300 mt-1 italic max-w-2xl truncate">
                "{currentRun.original_request}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switching Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-navy-950/80 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('workflow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'workflow'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Workflow Pipeline</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Timeline</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm shadow-violet-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                <span>Recovery Analytics</span>
              </button>
            </div>

            {currentRun && activeTab !== 'analytics' && currentRun.status === 'FAILED' && (
              <button
                onClick={handleRetryEntireRun}
                disabled={isRunning}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-500/20 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Failed</span>
              </button>
            )}
          </div>
        </div>

        {/* Transparent Execution summary banner */}
        {currentRun && activeTab !== 'analytics' && currentRun.execution_summary && (
          <div className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
            currentRun.status === 'SUCCEEDED'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : currentRun.status === 'FAILED'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Transparent Execution Report: </span>
              <span>{currentRun.execution_summary}</span>
            </div>
          </div>
        )}

        {/* Tab View Content */}
        {activeTab === 'analytics' ? (
          <div className="glass-panel rounded-2xl border border-white/10 p-5 sm:p-6">
            <RecoveryAnalyticsPanel onStepRecovered={loadDashboardData} />
          </div>
        ) : currentRun ? (
          activeTab === 'workflow' ? (
            <AgentWorkflowVisualizer
              steps={currentRun.steps}
              runId={currentRun.id}
              runStatus={currentRun.status}
              onStepRetried={handleStepRetried}
              onInspectEvidence={(step) => setSelectedEvidence({ runId: currentRun.id, stepId: step.id, stepData: step })}
            />
          ) : (
            <ExecutionTimeline
              steps={currentRun.steps}
              runId={currentRun.id}
              onStepRetried={handleStepRetried}
              onInspectEvidence={(step) => setSelectedEvidence({ runId: currentRun.id, stepId: step.id, stepData: step })}
            />
          )
        ) : (
          <div className="text-center py-12 glass-panel rounded-2xl border border-white/5">
            <Bot className="w-10 h-10 text-cyan-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-slate-300">No agent run selected</p>
            <p className="text-xs text-slate-400 mt-1">Execute a task above or select a run from history below.</p>
          </div>
        )}
      </div>

      {/* Recent Runs History Table */}
      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Recent Execution History</h3>
          </div>
          <Link to="/history" className="text-xs text-cyan-400 hover:underline">
            View All ({stats?.total_runs ?? recentRuns.length}) →
          </Link>
        </div>

        {recentRuns.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No previous agent runs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-mono text-slate-400 border-b border-white/10">
                <tr>
                  <th className="pb-3 font-semibold">Run ID</th>
                  <th className="pb-3 font-semibold">Instruction</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Steps</th>
                  <th className="pb-3 font-semibold">Executed</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentRuns.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-200">#{r.id}</td>
                    <td className="py-3 max-w-xs truncate text-slate-300">{r.original_request}</td>
                    <td className="py-3">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {r.steps?.length || 0} steps
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setCurrentRun(r)}
                        className="px-2.5 py-1 rounded bg-navy-850 hover:bg-cyan-500/20 text-cyan-300 border border-white/10 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ToolRegistryModal isOpen={toolModalOpen} onClose={() => setToolModalOpen(false)} />
      
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
