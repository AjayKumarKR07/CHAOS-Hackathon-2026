import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bot, Cpu, LayoutDashboard, CheckSquare, FileText, History, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-wider text-white">JARVIS</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">v1.0</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Personal AI Agent</p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className={`text-sm transition-colors ${isActive('/') ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
          >
            Home
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 text-sm transition-colors ${isActive('/dashboard') ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/tasks"
                className={`flex items-center gap-1.5 text-sm transition-colors ${isActive('/tasks') ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Tasks</span>
              </Link>
              <Link
                to="/notes"
                className={`flex items-center gap-1.5 text-sm transition-colors ${isActive('/notes') ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
              >
                <FileText className="w-4 h-4" />
                <span>Notes</span>
              </Link>
              <Link
                to="/runs"
                className={`flex items-center gap-1.5 text-sm transition-colors ${isActive('/runs') ? 'text-cyan-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </Link>
            </>
          ) : (
            <>
              <a href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-slate-300 hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#live-demo" className="text-sm text-slate-300 hover:text-white transition-colors">
                Architecture
              </a>
            </>
          )}
        </div>

        {/* Auth CTA Controls */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pl-3 py-1 pr-3.5 rounded-full bg-navy-850 border border-white/10">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <span className="text-xs text-slate-200 font-medium truncate max-w-[120px]">
                  {user?.full_name || user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-navy-850 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-slate-200 hover:text-white transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-navy-950 font-bold transition-all shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-navy-850 text-slate-300 hover:text-white border border-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 border-t border-white/10 flex flex-col gap-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/5"
          >
            Home
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/5"
              >
                Dashboard
              </Link>
              <Link
                to="/tasks"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/5"
              >
                Tasks
              </Link>
              <Link
                to="/notes"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/5"
              >
                Notes
              </Link>
              <Link
                to="/runs"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-white/5"
              >
                Run History
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-center text-sm text-slate-200 border border-white/10 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-center text-sm rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-navy-950 font-bold"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
