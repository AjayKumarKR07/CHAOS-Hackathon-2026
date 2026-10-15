import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Bot, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function DashboardLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex bg-grid-pattern selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Sidebar Component (Fixed on desktop, drawer on mobile) */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="flex-1 min-w-0 lg:pl-[250px] flex flex-col min-h-screen">
        {/* Mobile / Tablet Header (< lg only) */}
        <header className="lg:hidden h-14 border-b border-white/10 bg-[#0B1020]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white border border-white/10 transition-colors"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <span className="font-extrabold text-sm tracking-wider text-white">JARVIS</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm shadow-cyan-500/20">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Dashboard Pages Scrollable Container */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
