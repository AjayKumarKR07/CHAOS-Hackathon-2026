import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bot, 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  History, 
  Cpu, 
  ShieldCheck, 
  Settings, 
  User, 
  LogOut, 
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ToolRegistryModal } from './ToolRegistryModal';

export function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [toolModalOpen, setToolModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative ${
      isActive
        ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-sm shadow-cyan-500/10 pl-3'
        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
    }`;

  const renderNavContent = () => (
    <div className="flex flex-col h-full bg-[#0B1020] text-slate-100">
      {/* Top Brand Header */}
      <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between shrink-0">
        <NavLink to="/dashboard" onClick={onCloseMobile} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 p-0.5 shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <div className="w-full h-full bg-[#0B1020] rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-white">JARVIS</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                v1.0
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
              Personal AI Agent
            </p>
          </div>
        </NavLink>

        {/* Close button for mobile drawer */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Close Sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups Container */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {/* MAIN MENU */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Main Menu
          </div>
          <div className="space-y-1">
            <NavLink to="/dashboard" onClick={onCloseMobile} className={navLinkClasses}>
              {({ isActive }) => (
                <>
                  <LayoutDashboard className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>Dashboard</span>
                </>
              )}
            </NavLink>

            <NavLink to="/tasks" onClick={onCloseMobile} className={navLinkClasses}>
              {({ isActive }) => (
                <>
                  <CheckSquare className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>Tasks</span>
                </>
              )}
            </NavLink>

            <NavLink to="/notes" onClick={onCloseMobile} className={navLinkClasses}>
              {({ isActive }) => (
                <>
                  <FileText className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>Notes</span>
                </>
              )}
            </NavLink>

            <NavLink to="/history" onClick={onCloseMobile} className={navLinkClasses}>
              {({ isActive }) => (
                <>
                  <History className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>History</span>
                </>
              )}
            </NavLink>
          </div>
        </div>

        {/* AGENT SECTION */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Agent
          </div>
          <div className="space-y-1">
            <NavLink to="/dashboard" onClick={onCloseMobile} className={navLinkClasses}>
              {({ isActive }) => (
                <>
                  <Cpu className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="flex items-center gap-1.5">
                    <span>AI Agent</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  </span>
                </>
              )}
            </NavLink>

            <button
              onClick={() => {
                setToolModalOpen(true);
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] transition-all duration-200 group text-left"
            >
              <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span>Tool Integrations</span>
            </button>
          </div>
        </div>

        {/* ACCOUNT SECTION */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Account
          </div>
          <div className="space-y-1">
            <NavLink to="/profile" onClick={onCloseMobile} className={navLinkClasses}>
              {({ isActive }) => (
                <>
                  <User className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>Profile</span>
                </>
              )}
            </NavLink>

            <NavLink to="/settings" onClick={onCloseMobile} className={navLinkClasses}>
              {({ isActive }) => (
                <>
                  <Settings className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>Settings</span>
                </>
              )}
            </NavLink>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 group text-left"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3.5 border-t border-white/10 bg-black/20 shrink-0">
        <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Circular Avatar using user initial */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm shadow-cyan-500/20">
              {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.full_name || 'Agent User'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate leading-tight">
                {user?.email || 'authenticated'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tool Allowlist Modal */}
      <ToolRegistryModal isOpen={toolModalOpen} onClose={() => setToolModalOpen(false)} />
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex w-[250px] shrink-0 h-screen fixed inset-y-0 left-0 z-30 border-r border-white/10 shadow-xl shadow-black/40">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer Overlay & Slide-out */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative w-[260px] max-w-[80vw] h-full shadow-2xl border-r border-white/10 z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
}
