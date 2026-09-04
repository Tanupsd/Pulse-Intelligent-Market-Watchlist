import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Search, LogOut, SlidersHorizontal, Radio, Zap, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { stocksApi, marketApi } from '../services/api';

export default function Navbar({ onScenarioChange = null }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [providerMode, setProviderMode] = useState('live'); // 'live' | 'mock'
  const [currentScenario, setCurrentScenario] = useState('demo');
  const [isSwitching, setIsSwitching] = useState(false);

  const searchRef = useRef(null);

  useEffect(() => {
    marketApi.getProvider()
      .then(res => {
        if (res.data.mode) setProviderMode(res.data.mode);
        if (res.data.scenario) setCurrentScenario(res.data.scenario);
      })
      .catch(() => {});
  }, []);

  // Debounced search across live market & catalog
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await stocksApi.search(searchQuery.trim());
        setSearchResults(res.data.results || []);
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchProvider = async (newMode) => {
    setIsSwitching(true);
    try {
      await marketApi.setProvider(newMode);
      setProviderMode(newMode);
      if (onScenarioChange) onScenarioChange();
    } catch (err) {
      console.error('Failed to change provider mode:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSwitchScenario = async (newScenario) => {
    setIsSwitching(true);
    try {
      await marketApi.setScenario(newScenario);
      setCurrentScenario(newScenario);
      if (onScenarioChange) onScenarioChange();
    } catch (err) {
      console.error('Failed to change scenario:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-500 group-hover:scale-105 group-hover:bg-brand-500/25 transition-all">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white">Pulse</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  CODE 2026
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Smart Market Watchlist</p>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md relative" ref={searchRef}>
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isSearching ? 'text-brand-400 animate-pulse' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search ANY stock (e.g. Netflix, Palantir, Boeing, NVDA)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-surface-subtle border border-surface-border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
          </div>

          {/* Global Search Dropdown */}
          {showResults && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-surface border border-surface-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in max-h-80 flex flex-col">
              <div className="p-2.5 border-b border-surface-border/60 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-surface-subtle">
                <span>Matching Global Stocks ({searchResults.length})</span>
                <span className="text-[10px] text-brand-400 font-normal lowercase">click to analyze</span>
              </div>
              <div className="overflow-y-auto divide-y divide-surface-border/40">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching global stocks found.
                  </div>
                ) : (
                  searchResults.map((stock) => (
                    <div
                      key={stock.symbol}
                      onClick={() => {
                        setShowResults(false);
                        setSearchQuery('');
                        navigate(`/stocks/${stock.symbol}`);
                      }}
                      className="p-3 hover:bg-surface-hover cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs font-mono group-hover:text-brand-400 transition-colors">
                            {stock.symbol}
                          </span>
                          <span className="text-xs text-slate-300 truncate">{stock.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{stock.sector}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 group-hover:bg-brand-500 group-hover:text-white transition-all">
                          View →
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Mode Selector (Live vs Demo) & User Profile */}
        <div className="flex items-center gap-3">
          {/* Provider Toggle Pill */}
          <div className="hidden sm:flex items-center bg-surface-subtle border border-surface-border rounded-xl p-1 text-xs">
            {/* Live Mode Button */}
            <button
              onClick={() => handleSwitchProvider('live')}
              disabled={isSwitching}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                providerMode === 'live'
                  ? 'bg-emerald-500 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Real-time live prices and news for all global stocks"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${providerMode === 'live' ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
              <span>Live Market</span>
            </button>

            {/* Demo Mode Button */}
            <button
              onClick={() => handleSwitchProvider('mock')}
              disabled={isSwitching}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                providerMode === 'mock'
                  ? 'bg-brand-500 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Deterministic demo scenarios for hackathon evaluation"
            >
              <Zap className="w-3 h-3" />
              <span>Demo Scenarios</span>
            </button>
          </div>

          {/* Sub-scenario buttons when in Demo mode */}
          {providerMode === 'mock' && (
            <div className="hidden lg:flex items-center gap-1 bg-surface-subtle/80 border border-surface-border rounded-xl p-1 text-xs animate-in fade-in">
              <button
                onClick={() => handleSwitchScenario('demo')}
                className={`px-2 py-0.5 rounded text-[11px] ${currentScenario === 'demo' ? 'bg-surface text-brand-400 font-bold border border-surface-border' : 'text-slate-400'}`}
              >
                Demo
              </button>
              <button
                onClick={() => handleSwitchScenario('quiet')}
                className={`px-2 py-0.5 rounded text-[11px] ${currentScenario === 'quiet' ? 'bg-surface text-brand-400 font-bold border border-surface-border' : 'text-slate-400'}`}
              >
                Quiet
              </button>
              <button
                onClick={() => handleSwitchScenario('volatile')}
                className={`px-2 py-0.5 rounded text-[11px] ${currentScenario === 'volatile' ? 'bg-surface text-brand-400 font-bold border border-surface-border' : 'text-slate-400'}`}
              >
                Volatile
              </button>
            </div>
          )}

          {/* User Profile / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-surface-border">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">{user?.email?.split('@')[0] || 'Demo User'}</span>
              <span className="text-[10px] text-slate-400">{user?.email || 'demo@example.com'}</span>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
