import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  RefreshCw, 
  Cloud, 
  CloudOff, 
  CheckCircle2, 
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react';

export function DeviceSyncStatus({ onSync, variant = 'widget', className = '' }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncState, setSyncState] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date());
  const [errorMessage, setErrorMessage] = useState(null);
  const [timeAgo, setTimeAgo] = useState('Just now');
  const [deviceInfo, setDeviceInfo] = useState({
    formFactor: 'desktop',
    os: 'Windows',
    browser: 'Chrome',
    label: 'Desktop • Windows • Chrome',
  });

  const lastSyncTimeRef = useRef(Date.now());

  // Detect current client device form factor, OS, and browser
  const detectDevice = useCallback(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    const ua = navigator.userAgent || '';

    let formFactor = 'desktop';
    if (width < 640 || /Android|iPhone|iPod|Mobile/i.test(ua)) {
      formFactor = 'mobile';
    } else if (width < 1024 || /iPad|Tablet/i.test(ua)) {
      formFactor = 'tablet';
    }

    let os = 'Unknown OS';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Browser';
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/Chrome\//i.test(ua)) browser = 'Chrome';
    else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';

    setDeviceInfo({
      formFactor,
      os,
      browser,
      label: `${formFactor.charAt(0).toUpperCase() + formFactor.slice(1)} (${os} • ${browser})`,
    });
  }, []);

  // Format dynamic relative time
  const updateRelativeTime = useCallback(() => {
    const diffSeconds = Math.floor((Date.now() - lastSyncTimeRef.current) / 1000);
    if (diffSeconds < 10) {
      setTimeAgo('Just now');
    } else if (diffSeconds < 60) {
      setTimeAgo(`${diffSeconds}s ago`);
    } else if (diffSeconds < 3600) {
      const mins = Math.floor(diffSeconds / 60);
      setTimeAgo(`${mins}m ago`);
    } else {
      setTimeAgo(new Date(lastSyncTimeRef.current).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  // Execute synchronization
  const handleSync = useCallback(async (isAuto = false) => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setSyncState('offline');
      return;
    }

    setSyncState('syncing');
    setErrorMessage(null);

    try {
      if (onSync) {
        await onSync();
      }
      const now = new Date();
      lastSyncTimeRef.current = now.getTime();
      setLastSyncedAt(now);
      setTimeAgo('Just now');
      setSyncState('synced');

      // Clear 'synced' banner after 2.5 seconds
      setTimeout(() => {
        setSyncState((prev) => (prev === 'synced' ? 'idle' : prev));
      }, 2500);
    } catch (err) {
      console.warn('[Sync] Sync failed:', err.message || err);
      setSyncState('error');
      setErrorMessage(err.message || 'Synchronization request failed. Please retry.');
    }
  }, [onSync]);

  // Setup listeners for network state, visibility/revisit, and window resize
  useEffect(() => {
    detectDevice();

    const handleResize = () => detectDevice();
    window.addEventListener('resize', handleResize);

    const handleOnline = () => {
      setIsOnline(true);
      setSyncState('idle');
      // Auto-sync upon reconnection
      handleSync(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Refresh data when user switches back to this tab or window
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        const elapsed = (Date.now() - lastSyncTimeRef.current) / 1000;
        // Throttle auto-refresh to once every 20 seconds
        if (elapsed >= 20) {
          handleSync(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Timer to update relative time
    const timer = setInterval(updateRelativeTime, 10000);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(timer);
    };
  }, [detectDevice, handleSync, updateRelativeTime]);

  // Device icon rendering
  const renderDeviceIcon = () => {
    switch (deviceInfo.formFactor) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-cyan-400" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-cyan-400" />;
      default:
        return <Monitor className="w-4 h-4 text-cyan-400" />;
    }
  };

  // Compact variant (e.g. for header bar)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 flex-wrap text-xs ${className}`}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-navy-950/80 border border-white/10 text-slate-300">
          {renderDeviceIcon()}
          <span className="font-mono text-[11px] hidden sm:inline">{deviceInfo.label}</span>
          <span className="font-mono text-[11px] sm:hidden">{deviceInfo.formFactor}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-navy-950/80 border border-white/10 text-slate-300">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Offline</span>
            </span>
          )}
          <span className="text-slate-500">•</span>
          <span className="text-[11px] text-slate-400 font-mono">Synced {timeAgo}</span>
        </div>

        <button
          type="button"
          onClick={() => handleSync(false)}
          disabled={syncState === 'syncing' || !isOnline}
          aria-label="Synchronize data across devices"
          title="Pull latest verified state across devices from MongoDB Atlas"
          className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3 h-3 ${syncState === 'syncing' ? 'animate-spin text-cyan-400' : ''}`} />
          <span className="hidden xs:inline">Sync Now</span>
        </button>
      </div>
    );
  }

  // Full Widget variant (for Dashboard or Settings page)
  return (
    <div className={`glass-panel rounded-2xl border border-white/10 p-4 sm:p-5 relative overflow-hidden space-y-3 ${className}`}>
      {/* Top Row: Device Info, Connection State, and Sync Now Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            {renderDeviceIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Device & Cloud Sync Status
              </h3>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Offline
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Active Client: <span className="text-slate-200 font-medium">{deviceInfo.label}</span>
            </p>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => handleSync(false)}
            disabled={syncState === 'syncing' || !isOnline}
            aria-label="Sync data across devices"
            title="Fetch the latest tasks, notes, and execution history from MongoDB Atlas"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncState === 'syncing' ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{syncState === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Status Bar */}
      <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Cloud className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Shared Source: <strong className="text-cyan-300">MongoDB Atlas Cloud</strong></span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400">Strict User Isolation</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Last synchronized:</span>
          <strong className="text-slate-200 font-mono">{timeAgo}</strong>
          <span className="text-slate-500">({lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
        </div>
      </div>

      {/* Sync State Alerts */}
      {syncState === 'synced' && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Latest tasks, notes, and agent workflow history refreshed from MongoDB Atlas.</span>
        </div>
      )}

      {syncState === 'offline' && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>You are currently offline. Local session data will sync when connectivity resumes.</span>
          </div>
          <button 
            type="button" 
            onClick={() => handleSync(false)}
            className="underline hover:text-white shrink-0 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {syncState === 'error' && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage || 'Sync encountered a network issue.'}</span>
          </div>
          <button 
            type="button" 
            onClick={() => handleSync(false)}
            className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-[11px] font-semibold shrink-0"
          >
            Retry Sync
          </button>
        </div>
      )}
    </div>
  );
}
