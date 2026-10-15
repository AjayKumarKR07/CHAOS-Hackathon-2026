import React, { useEffect, useState } from 'react';
import { User, Mail, ShieldCheck, Calendar, LogOut, CheckCircle2, Bot, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { agentService } from '../services/agentService';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    agentService.getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-white/10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <User className="w-7 h-7 text-cyan-400" />
          <span>User Profile</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Identity, cryptographic session credentials, and agent ownership records
        </p>
      </div>

      {/* Profile Card */}
      <div className="glass-panel rounded-2xl border border-white/10 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 p-1 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0B1020] rounded-[14px] flex items-center justify-center text-2xl font-black text-white">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">{user?.full_name || 'Agent User'}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>User ID: #{user?.id || '—'}</span>
            </div>
          </div>
        </div>

        {/* Security & Access Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
          <div className="p-4 rounded-xl bg-navy-950/70 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Authentication Security</span>
            </div>
            <p className="text-xs text-slate-300">
              Password protected using industry-standard bcrypt hashing. Sessions are signed with HS256 JWT tokens.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Active Session
            </div>
          </div>

          <div className="p-4 rounded-xl bg-navy-950/70 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <Database className="w-4 h-4" />
              <span>Tenant Isolation</span>
            </div>
            <p className="text-xs text-slate-300">
              All tasks, notes, and agent runs are strictly scoped to your tenant ID in the database.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono border border-cyan-500/20">
              <CheckCircle2 className="w-3 h-3" /> Tenant Boundary Active
            </div>
          </div>
        </div>

        {/* Lifetime Activity Stats */}
        {stats && (
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
              Lifetime Execution Summary
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-navy-950/50 border border-white/5">
                <div className="text-lg font-bold text-white font-mono">{stats.total_runs}</div>
                <div className="text-[11px] text-slate-400">Agent Runs</div>
              </div>
              <div className="p-3 rounded-xl bg-navy-950/50 border border-white/5">
                <div className="text-lg font-bold text-cyan-400 font-mono">{stats.total_tasks}</div>
                <div className="text-[11px] text-slate-400">Tasks Managed</div>
              </div>
              <div className="p-3 rounded-xl bg-navy-950/50 border border-white/5">
                <div className="text-lg font-bold text-violet-400 font-mono">{stats.total_notes}</div>
                <div className="text-[11px] text-slate-400">Notes Persisted</div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Action */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
